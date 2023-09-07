import { FARCASTER_EPOCH, Message } from "@farcaster/hub-nodejs";
import { Client, convertToHex } from "./hub";
import {
  Cast,
  CastData,
  CastEmbedCast,
  CastEmbedUrl,
  CastMention,
  upsertCastDatas,
} from "../db/cast";
import { extractLinks } from "../links";
import { generateReactionData } from "./reactions";
import {
  CastReaction,
  UrlReaction,
  upsertCastReactions,
  upsertUrlReactions,
} from "../db/reaction";

export const handleCastMessages = async (
  client: Client,
  messages: Message[],
  withReactions = false
) => {
  const castData = (
    await Promise.all(messages.map((message) => generateCastData(message)))
  ).filter(Boolean) as CastData[];

  const parentCastData = await getParentCasts(
    client,
    castData.map(({ hash, fid }) => [fid, hash]),
    castData
  );

  const allCastData = castData.concat(parentCastData);

  const allCastDataMap = allCastData.reduce((acc, cast) => {
    acc[cast.hash] = cast.cast;
    return acc;
  }, {} as Record<string, Cast>);

  const allCastDataWithTopParents = allCastData.map((cast) => {
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

  await upsertCastDatas(allCastDataWithTopParents);

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

    await Promise.all([
      upsertCastReactions(castReactions),
      upsertUrlReactions(urlReactions),
    ]);
  }
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
        return {
          hash,
          fid,
          timestamp,
          url: embed.url,
          urlHost: embed.url?.startsWith("chain://")
            ? undefined
            : new URL(embed.url).host,
          urlPath: embed.url?.startsWith("chain://")
            ? undefined
            : new URL(embed.url).pathname,
          urlParams: embed.url?.startsWith("chain://")
            ? undefined
            : new URL(embed.url).searchParams.toString(),
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
    .filter((embed) => !castEmbedUrls.some((e) => e.url.includes(embed.url)));

  return {
    fid,
    hash,
    cast,
    castMentions,
    castEmbedCasts,
    castEmbedUrls: castEmbedUrls.concat(customCastEmbedUrls),
  } as CastData;
};
