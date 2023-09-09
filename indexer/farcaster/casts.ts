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
import { getCastsMissingKeywords, upsertKeywords } from "../db/keyword";
import { FarcasterCast } from "@prisma/client";

export const handleCastMessages = async (
  client: Client,
  messages: Message[],
  withReactions = false
) => {
  const castData = messages
    .map((message) => generateCastData(message))
    .filter(Boolean) as CastData[];

  const existingCasts = await getExistingCasts(castData);
  const existingCastsMap = existingCasts.reduce(
    (acc: Record<string, boolean>, cur: FarcasterCast) => {
      acc[`${cur.fid}-${cur.hash}`] = true;
      return acc;
    },
    {} as Record<string, boolean>
  );

  const allCastData = await getParentCasts(
    client,
    castData.map(({ hash, fid }) => [fid, hash]),
    castData
  );

  for (const data of castData) {
    if (!allCastData.some((cast) => cast.hash === data.hash)) {
      allCastData.push(data);
    }
  }

  const filteredCastData = allCastData.filter(
    (cast) => !existingCastsMap[`${cast.fid}-${cast.hash}`]
  );

  if (filteredCastData.length === 0) return [];

  const allCastDataMap = filteredCastData.reduce((acc, cast) => {
    acc[cast.hash] = cast.cast;
    return acc;
  }, {} as Record<string, Cast>);

  const allCastDataWithTopParents = filteredCastData.map((cast) => {
    let topParent = cast.cast.parentCast
      ? allCastDataMap[cast.cast.parentCast]
      : undefined;

    while (topParent?.parentCast) {
      topParent = allCastDataMap[topParent.parentCast];
    }

    return {
      ...cast,
      cast: {
        ...cast.cast,
        topParentCast: topParent?.hash || cast.cast.hash,
        topParentFid: topParent?.fid || cast.cast.fid,
        topParentUrl: topParent?.parentUrl || cast.cast.parentUrl,
      },
    };
  });

  console.log(
    `[cast-ingest] [${castData[0].fid}] processing ${
      messages.length
    } casts (+ ${allCastDataWithTopParents.length - messages.length} parents)`
  );

  const newCasts = await upsertCastDatas(allCastDataWithTopParents);

  const batchSize = 100;
  const keywords = [];

  const missingKeywords = await getCastsMissingKeywords(newCasts);

  for (let i = 0; i < missingKeywords.length; i += batchSize) {
    const batch = missingKeywords.slice(i, i + batchSize);
    const batchKeywords = (
      await Promise.all(batch.map((cast) => extractKeywords(cast)))
    ).flat();
    keywords.push(...batchKeywords);
    if (i % 1000 === 0) {
      console.log(
        `[keyword-extract] [${castData[0].fid}] processed ${i + batchSize} of ${
          missingKeywords.length
        }`
      );
    }
  }

  const promises = [upsertKeywords(keywords)];

  if (withReactions) {
    const reactions = (
      await Promise.all(
        allCastDataWithTopParents.map(async ({ fid, hash }) => {
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

    promises.push(upsertCastReactions(castReactions));
    promises.push(upsertUrlReactions(urlReactions));
  }

  await Promise.all(promises);
  return allCastData;
};

export const getParentCasts = async (
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
          return generateCastData(cast);
        }
      })
    )
  ).filter(Boolean) as CastData[];

  const newSeenCasts = castIds.concat(seenCasts);

  return newCasts.concat(await getParentCasts(client, newSeenCasts, newCasts));
};

export const generateCastData = (message: Message) => {
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
