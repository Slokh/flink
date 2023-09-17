import { FARCASTER_EPOCH, Message } from "@farcaster/hub-nodejs";
import { Client, convertToHex } from "./hub";
import {
  Cast,
  CastData,
  CastEmbedCast,
  CastEmbedUrl,
  CastMention,
  getExistingCasts,
  upsertCastDatas,
} from "../db/cast";
import { extractLinks, normalizeLink } from "../links";
import { generateReactionData } from "./reactions";
import {
  CastReaction,
  UrlReaction,
  upsertCastReactions,
  upsertUrlReactions,
} from "../db/reaction";
import { extractKeywords } from "../keywords";
import { upsertKeywords } from "../db/keyword";
import { FarcasterCast } from "@prisma/client";

export const handleCastMessages = async (
  client: Client,
  messages: Message[],
  withReactions = false
) => {
  if (messages.length === 0) return [];

  console.log(
    `[cast-ingest] [${messages[0].data?.fid}] processing ${messages.length} messages`
  );

  const castDatas = messagesToCastDatas(messages);
  const existingCastsMap = await getExistingCastMap(castDatas);
  const newCastDatas = castDatas.filter(
    ({ fid, hash }) => !existingCastsMap[`${fid}-${hash}`]
  );

  const parentCastDatas = await getParentCasts(
    client,
    newCastDatas.map(({ hash, fid }) => [fid, hash]),
    newCastDatas
  );
  const existingParentCastsMap = await getExistingCastMap(parentCastDatas);
  const newParentCastDatas = parentCastDatas.filter(
    ({ fid, hash }) =>
      !existingParentCastsMap[`${fid}-${hash}`] &&
      !existingCastsMap[`${fid}-${hash}`]
  );

  console.log(
    `[cast-ingest] [${messages[0].data?.fid}] found casts: ${
      castDatas.length
    } - existing: ${Object.keys(existingCastsMap).length} new: ${
      newCastDatas.length
    }`
  );

  console.log(
    `[cast-ingest] [${messages[0].data?.fid}] found parents: ${
      parentCastDatas.length
    } - existing: ${Object.keys(existingParentCastsMap).length} new: ${
      newParentCastDatas.length
    }`
  );

  const allCastDatas = castDatas.concat(parentCastDatas);
  const allNewCastDatas = newCastDatas.concat(newParentCastDatas);

  const finalCastDatas = await getCastDatasWithParents(
    allCastDatas,
    allNewCastDatas
  );
  await upsertCastDatas(finalCastDatas);

  const promises = [extractKeywordsFromCasts(finalCastDatas)];
  if (withReactions) {
    promises.push(extractReactionsFromCasts(client, finalCastDatas));
  }
  await Promise.all(promises);

  return finalCastDatas;
};

const getParentCasts = async (
  client: Client,
  seenCasts: [number, string][],
  casts: CastData[]
): Promise<CastData[]> => {
  if (casts.length === 0) return [];
  const castIds = casts
    .filter(
      ({ cast }) =>
        cast.parentCast &&
        cast.parentFid &&
        !seenCasts.some(
          ([fid, hash]) => fid === cast.parentFid && hash === cast.parentCast
        )
    )
    .map(({ cast }) => [cast.parentFid, cast.parentCast]) as [number, string][];

  const newCasts = (
    await Promise.all(
      castIds.map(async (parentCastId) => {
        const cast = await client.getCast(parentCastId[0], parentCastId[1]);
        if (cast) {
          return messageToCastData(cast);
        }
      })
    )
  ).filter(Boolean) as CastData[];

  const newSeenCasts = castIds.concat(seenCasts);

  return newCasts.concat(await getParentCasts(client, newSeenCasts, newCasts));
};

const getCastDatasWithParents = async (
  allCastDatas: CastData[],
  newCastDatas: CastData[]
) => {
  const allCastDataMap = allCastDatas.reduce((acc, cast) => {
    acc[cast.hash] = cast.cast;
    return acc;
  }, {} as Record<string, Cast>);

  return newCastDatas.map((castData) => {
    let topParent = castData.cast.parentCast
      ? allCastDataMap[castData.cast.parentCast]
      : undefined;

    while (topParent?.parentCast) {
      topParent = allCastDataMap[topParent.parentCast];
    }

    return {
      ...castData,
      cast: {
        ...castData.cast,
        topParentCast: topParent?.hash || castData.cast.hash,
        topParentFid: topParent?.fid || castData.cast.fid,
        topParentUrl: topParent?.parentUrl || castData.cast.parentUrl,
      },
    };
  });
};

const extractKeywordsFromCasts = async (casts: CastData[]) => {
  const batchSize = 100;
  const keywords = [];

  for (let i = 0; i < casts.length; i += batchSize) {
    const batch = casts.slice(i, i + batchSize);
    const batchKeywords = (
      await Promise.all(batch.map((cast) => extractKeywords(cast.cast)))
    ).flat();
    keywords.push(...batchKeywords);
    if (i % 1000 === 0) {
      console.log(
        `[keyword-extract] [${casts[0].fid}] processed ${i} of ${casts.length}`
      );
    }
  }

  await upsertKeywords(keywords);
};

export const extractReactionsFromCasts = async (
  client: Client,
  casts: CastData[]
) => {
  if (!casts.length) return;

  const reactions = (
    await Promise.all(
      casts.map(async ({ fid, hash }) => {
        const messages = await client.getReactionMessages(fid, hash);
        return messages.map(generateReactionData);
      })
    )
  ).flat();

  const castReactions = reactions.filter(
    (reaction) => reaction?.targetHash
  ) as CastReaction[];

  const urlReactions = reactions.filter(
    (reaction) => reaction?.targetUrl
  ) as UrlReaction[];

  console.log(
    `[reaction-extract] [${casts[0].fid}] found ${reactions.length} reactions`
  );

  await Promise.all([
    upsertCastReactions(castReactions),
    upsertUrlReactions(urlReactions),
  ]);
};

const getExistingCastMap = async (castDatas: CastData[]) => {
  const existingCasts = await getExistingCasts(castDatas);
  return existingCasts.reduce(
    (acc: Record<string, FarcasterCast>, cur: FarcasterCast) => {
      acc[`${cur.fid}-${cur.hash}`] = cur;
      return acc;
    },
    {} as Record<string, FarcasterCast>
  );
};

export const messagesToCastDatas = (messages: Message[]) => {
  return messages
    .map((message) => messageToCastData(message))
    .filter(Boolean) as CastData[];
};

const messageToCastData = (message: Message) => {
  const messageData = message.data;
  if (!messageData?.castAddBody) {
    return;
  }

  const fid = messageData.fid;
  const timestamp = new Date(messageData.timestamp * 1000 + FARCASTER_EPOCH);
  const castAddBody = messageData.castAddBody;
  const hash = convertToHex(message.hash);

  const cast: Cast = {
    fid,
    hash,
    timestamp,
    text: castAddBody.text,
  };

  if (castAddBody.parentCastId) {
    cast.parentCast = convertToHex(castAddBody.parentCastId.hash);
    cast.parentFid = castAddBody.parentCastId.fid;
  } else if (castAddBody.parentUrl) {
    cast.parentUrl = castAddBody.parentUrl;
  }

  const mentions = castAddBody.mentions || [];
  const mentionsPositions = castAddBody.mentionsPositions || [];
  const castMentions: CastMention[] = mentions.map((mention, i) => ({
    hash,
    fid,
    timestamp,
    mention,
    mentionPosition: mentionsPositions[i],
  }));

  const embeds = castAddBody.embeds || [];

  const castEmbedCasts: CastEmbedCast[] = embeds
    .map((embed) => {
      if (embed.castId) {
        const embedHash = convertToHex(embed.castId.hash);
        const embedFid = embed.castId.fid;
        return {
          hash,
          fid,
          timestamp,
          embedHash,
          embedFid,
        };
      }
    })
    .filter(Boolean) as CastEmbedCast[];

  const castEmbedUrls: CastEmbedUrl[] = embeds
    .map((embed) => {
      if (embed.url) {
        let urlHost;
        let urlPath;
        let urlParams;
        if (!embed.url.startsWith("chain://")) {
          const normalizedUrl = normalizeLink(embed.url);
          urlHost = normalizedUrl.split("/")[0];
          urlPath = normalizedUrl.split("/").slice(1).join("/").split("?")[0];
          urlParams = normalizedUrl.split("?")[1];
        }
        return {
          hash,
          fid,
          timestamp,
          url: embed.url,
          urlHost,
          urlPath,
          urlParams,
          parsed: false,
        };
      }
    })
    .filter(Boolean) as CastEmbedUrl[];

  const customCastEmbedUrls: CastEmbedUrl[] = extractLinks(castAddBody.text)
    .map((url) => {
      return {
        hash,
        fid,
        timestamp,
        url,
        urlHost: url.split("/")[0],
        urlPath: url.split("/").slice(1).join("/"),
        urlParams: url.split("?")[1],
        parsed: true,
      };
    })
    .filter(
      (embed, i) =>
        !castEmbedUrls.some(
          (e) => e.url.toLowerCase() === embed.url.toLowerCase()
        )
    );

  return {
    fid,
    hash,
    cast,
    castMentions,
    castEmbedCasts,
    castEmbedUrls: castEmbedUrls.concat(customCastEmbedUrls),
  } as CastData;
};
