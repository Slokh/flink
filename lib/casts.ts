import { getEmbedMetadata } from "@/indexer/embeds";
import { normalizeLink } from "@/indexer/links";
import prisma from "@/lib/prisma";
import { Embed, FarcasterMention, FarcasterUser } from "@/lib/types";

const PAGE_SIZE = 25;

interface FidHash {
  fid: number;
  hash: string;
}

export const getCast = async (hash: string) => {
  const casts = await prisma.farcasterCast.findMany({
    where: {
      OR: [
        { topParentCast: hash, deleted: false },
        { parentCast: hash, deleted: false },
        { hash, deleted: false },
      ],
    },
    include: {
      mentions: true,
    },
  });

  const cast = casts.find((cast) => cast.hash === hash);
  if (cast?.parentCast) {
    const parentCasts = await prisma.farcasterCast.findMany({
      where: { hash: cast.parentCast, deleted: false },
      include: {
        mentions: true,
      },
    });
    casts.push(...parentCasts);
  }

  return await getCastsResponse(casts);
};

export const getCastsResponseByHotness = async (
  page: number,
  parentUrl?: string
) => {
  const results: FidHash[] = parentUrl
    ? await prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "targetFid",
            "targetHash",
            SUM(
                CASE 
                    WHEN "reactionType" = 'like' THEN 1
                    WHEN "reactionType" = 'recast' THEN 0.5
                    ELSE 0
                END
            ) AS weighted_votes,
            EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCastReaction"."timestamp"))) AS age_in_seconds
        FROM "public"."FarcasterCastReaction"
          JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
        WHERE "FarcasterCast"."parentUrl" = ${parentUrl}
        GROUP BY "targetFid", "targetHash"
    )

    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        LOG(GREATEST(ABS(weighted_votes), 1)) - 
        (age_in_seconds / 86400) AS hotness
    FROM ReactionCounts
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `
    : await prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "targetFid",
            "targetHash",
            SUM(
                CASE 
                    WHEN "reactionType" = 'like' THEN 1
                    WHEN "reactionType" = 'recast' THEN 0.5
                    ELSE 0
                END
            ) AS weighted_votes,
            EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCastReaction"."timestamp"))) AS age_in_seconds
        FROM "public"."FarcasterCastReaction"
          WHERE "FarcasterCastReaction"."timestamp" >= NOW() - '7 days'::interval
        GROUP BY "targetFid", "targetHash"
    )

    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        LOG(GREATEST(ABS(weighted_votes), 1)) - 
        (age_in_seconds / 86400) AS hotness
    FROM ReactionCounts
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;

  const casts = await getCastsByFidHashes(
    results.map((cast) => ({
      fid: cast.fid,
      hash: cast.hash,
    }))
  );

  const castMap = casts.reduce((acc: any, cast: any) => {
    acc[`${cast.fid}-${cast.hash}`] = cast;
    return acc;
  }, {} as Record<string, any>);

  const orderedCasts = results.map(
    (result) => castMap[`${result.fid}-${result.hash}`]
  );

  return await getCastsResponse(orderedCasts);
};

const getTimeInterval = (
  time: "hour" | "day" | "week" | "month" | "year" | "all"
) => {
  switch (time) {
    case "hour":
      return "1 hours";
    case "day":
      return "24 hours";
    case "week":
      return "7 days";
    case "month":
      return "30 days";
    case "year":
      return "1 year";
    case "all":
      return "100 years"; // Adjust the interval as per your requirement
    default:
      return "24 hours";
  }
};

export const getCastsResponseByTopLikes = async (
  page: number,
  replies: boolean,
  time: "hour" | "day" | "week" | "month" | "year" | "all",
  parentUrl?: string,
  fid?: number
) => {
  const timeInterval = getTimeInterval(time);

  const results: FidHash[] = await (parentUrl
    ? prisma.$queryRaw`
    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        COUNT(*) as count
    FROM "public"."FarcasterCastReaction"
      JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
    WHERE
        "reactionType" = 'like'
        AND "FarcasterCast"."timestamp" >= NOW() -  ${timeInterval}::interval
        AND "FarcasterCast"."parentUrl" = ${parentUrl}
        AND NOT "FarcasterCast"."deleted"
    GROUP BY "targetFid", "targetHash"
    ORDER BY COUNT(*) DESC, "targetFid" DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `
    : fid
    ? replies
      ? prisma.$queryRaw`
    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        COUNT(*) as count
    FROM "public"."FarcasterCastReaction"
      JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
    WHERE
        "reactionType" = 'like'
        AND "FarcasterCast"."timestamp" >= NOW() - ${timeInterval}::interval
        AND "FarcasterCast"."fid" = ${fid}
        AND "FarcasterCast"."parentCast" IS NOT NULL
        AND NOT "FarcasterCast"."deleted"
    GROUP BY "targetFid", "targetHash"
    ORDER BY COUNT(*) DESC, "targetFid" DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `
      : prisma.$queryRaw`
    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        COUNT(*) as count
    FROM "public"."FarcasterCastReaction"
      JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
    WHERE
        "reactionType" = 'like'
        AND "FarcasterCast"."timestamp" >= NOW() - ${timeInterval}::interval
        AND "FarcasterCast"."fid" = ${fid}
        AND "FarcasterCast"."parentCast" IS NULL
        AND NOT "FarcasterCast"."deleted"
    GROUP BY "targetFid", "targetHash"
    ORDER BY COUNT(*) DESC, "targetFid" DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `
    : prisma.$queryRaw`
    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        COUNT(*) as count
    FROM "public"."FarcasterCastReaction"
      JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
    WHERE
        "reactionType" = 'like'
        AND "FarcasterCast"."timestamp" >= NOW() - ${timeInterval}::interval
        AND "FarcasterCast"."parentCast" IS NULL
        AND NOT "FarcasterCast"."deleted"
    GROUP BY "targetFid", "targetHash"
    ORDER BY COUNT(*) DESC, "targetFid" DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `);

  const casts = await getCastsByFidHashes(
    results.map((cast) => ({
      fid: cast.fid,
      hash: cast.hash,
    }))
  );

  const castMap = casts.reduce((acc: any, cast: any) => {
    acc[`${cast.fid}-${cast.hash}`] = cast;
    return acc;
  }, {} as Record<string, any>);

  const orderedCasts = results.map(
    (result) => castMap[`${result.fid}-${result.hash}`]
  );

  return await getCastsResponse(orderedCasts);
};

export const getCastsResponseByNewness = async (
  page: number,
  replies: boolean,
  parentUrl?: string,
  fid?: number
) => {
  const casts = await prisma.farcasterCast.findMany({
    where: {
      parentCast: replies
        ? {
            not: null,
          }
        : {
            equals: null,
          },
      ...(parentUrl ? { parentUrl } : {}),
      ...(fid ? { fid } : {}),
      deleted: false,
    },
    orderBy: {
      timestamp: "desc",
    },
    include: {
      mentions: true,
    },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  return await getCastsResponse(casts);
};

export const getCastsResponseByFid = async (page: number, fid?: number) => {
  const casts = await prisma.farcasterCast.findMany({
    where: {
      parentCast: {
        equals: null,
      },
      ...(fid ? { fid } : {}),
    },
    orderBy: {
      timestamp: "desc",
    },
    include: {
      mentions: true,
    },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  return await getCastsResponse(casts);
};

const getCastsResponse = async (casts: any) => {
  let allCasts = casts.concat(
    await getCastsByFidHashes(
      casts
        .filter(({ parentCast }: any) => parentCast)
        .flatMap((cast: any) => [
          {
            fid: cast.parentFid,
            hash: cast.parentCast,
          },
          {
            fid: cast.topParentFid,
            hash: cast.topParentCast,
          },
        ])
    )
  );

  const castMap = allCasts.reduce((acc: any, cast: any) => {
    acc[`${cast.fid}-${cast.hash}`] = cast;
    return acc;
  }, {} as Record<string, any>);

  const relevantFids = getRelevantFids(Object.values(castMap));

  const [userMap, embedMap, likeMap, recastMap, replyMap] = await Promise.all([
    getUsersByFids(relevantFids),
    getEmbedsForCasts(casts),
    getReactionsForCasts(casts, "like"),
    getReactionsForCasts(casts, "recast"),
    getRepliesForCast(casts),
  ]);

  return casts.map((cast: any) => ({
    user: userMap[cast.fid],
    hash: cast.hash,
    timestamp: cast.timestamp.toISOString(),
    parentCast:
      cast.parentFid && cast.parentCast
        ? {
            user: userMap[cast.parentFid],
            ...castMap[`${cast.parentFid}-${cast.parentCast}`],
          }
        : undefined,
    parentUrl: cast.parentUrl || undefined,
    topParentCast:
      cast.topParentFid && cast.topParentCast
        ? {
            user: userMap[cast.topParentFid],
            ...castMap[`${cast.topParentFid}-${cast.topParentCast}`],
          }
        : undefined,
    topParentUrl: cast.topParentUrl || undefined,
    text: cast.text,
    mentions:
      cast.mentions?.map((mention: any) => ({
        mention: userMap[mention.mention],
        position: mention.mentionPosition,
      })) || [],
    embeds: embedMap[`${cast.fid}-${cast.hash}`] || [],
    likes: likeMap[`${cast.fid}-${cast.hash}`] || 0,
    recasts: recastMap[`${cast.fid}-${cast.hash}`] || 0,
    replies: replyMap[`${cast.fid}-${cast.hash}`] || 0,
  }));
};

const getUsersByFids = async (fids: number[]) => {
  const users = await prisma.farcaster.findMany({
    where: {
      fid: {
        in: fids,
      },
    },
  });
  return users.reduce((acc, user) => {
    acc[user.fid] = {
      fid: user.fid,
      fname: user.fname || undefined,
      pfp: user.pfp || undefined,
      display: user.display || undefined,
    };
    return acc;
  }, {} as Record<number, FarcasterUser>);
};

const getCastsByFidHashes = async (fidHashes: FidHash[]) => {
  return await prisma.farcasterCast.findMany({
    where: {
      OR: fidHashes,
    },
    include: {
      mentions: true,
    },
  });
};

const getRelevantFids = (casts: any) => {
  const fids: Record<number, boolean> = {};
  for (const cast of casts) {
    fids[cast.fid] = true;
    cast.mentions?.forEach((mention: any) => {
      fids[mention.mention] = true;
    });
  }
  return Object.keys(fids).map((fid) => parseInt(fid));
};

const getRepliesForCast = async (casts: any) => {
  const replyCounts = await prisma.farcasterCast.groupBy({
    by: ["topParentFid", "topParentCast"],
    where: {
      OR: casts.map((cast: any) => ({
        topParentFid: cast.fid,
        topParentCast: cast.hash,
        deleted: false,
      })),
    },
    _count: true,
  });

  return replyCounts.reduce((acc: any, replyCount: any) => {
    acc[`${replyCount.topParentFid}-${replyCount.topParentCast}`] =
      replyCount._count - 1;
    return acc;
  }, {} as Record<string, number>);
};

const getEmbedsForCasts = async (casts: any) => {
  const urlEmbeds = await prisma.farcasterCastEmbedUrl.findMany({
    where: {
      OR: casts.map((cast: any) => ({
        fid: cast.fid,
        hash: cast.hash,
      })),
    },
  });

  const embedsToFetch = urlEmbeds.filter(
    ({ url, contentMetadata, contentType }: any) =>
      url &&
      (!contentMetadata ||
        (Object.keys(contentMetadata).length === 0 &&
          url.startsWith("chain://"))) &&
      (!contentType || !contentType.includes("image"))
  );

  let fetchedEmbedsMap: Record<string, any> = {};

  if (embedsToFetch.length > 0) {
    const fetchedEmbeds = await Promise.all(
      embedsToFetch.map(async ({ url }: any) => await getEmbedMetadata(url))
    );

    await prisma.farcasterCastEmbedUrl.deleteMany({
      where: {
        OR: embedsToFetch.map(({ fid, hash, url }: any) => ({
          fid,
          hash,
          url,
        })),
      },
    });

    await prisma.farcasterCastEmbedUrl.createMany({
      data: fetchedEmbeds.map((embed: any, i) => ({
        ...embedsToFetch[i],
        ...embed,
      })),
      skipDuplicates: true,
    });

    fetchedEmbedsMap = fetchedEmbeds.reduce(
      (acc: any, embed: any, i: number) => {
        acc[embedsToFetch[i].url] = embed;
        return acc;
      },
      {} as Record<string, any>
    );
  }

  return urlEmbeds.reduce((acc: any, embed: any) => {
    const key = `${embed.fid}-${embed.hash}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      ...embed,
      ...fetchedEmbedsMap[embed.url],
    });
    return acc;
  }, {} as Record<string, Embed>);
};

const getReactionsForCasts = async (
  casts: FidHash[],
  reactionType: "like" | "recast"
) => {
  const reactions = await prisma.farcasterCastReaction.groupBy({
    by: ["targetFid", "targetHash"],
    where: {
      reactionType,
      OR: casts.map((cast) => ({
        targetFid: cast.fid,
        targetHash: cast.hash,
        deleted: false,
      })),
    },
    _count: true,
  });

  return reactions.reduce((acc, reaction) => {
    acc[`${reaction.targetFid}-${reaction.targetHash}`] = reaction._count;
    return acc;
  }, {} as Record<string, number>);
};

export const formatText = (
  text: string,
  mentions: FarcasterMention[],
  embeds: Embed[],
  withLinks: boolean
) => {
  let offset = 0;
  let updatedMentionsPositions = []; // Array to store updated positions

  // Convert text to a Buffer object to deal with bytes
  let textBuffer = Buffer.from(text, "utf-8");

  for (let i = 0; i < mentions.length; i++) {
    // Assuming mentionsPositions consider newlines as bytes, so no newline adjustment
    const adjustedMentionPosition = mentions[i].position;
    const mentionUsername = mentions[i].mention.fname;

    const mentionLink = withLinks
      ? `<a href="/${mentionUsername}" class="current relative hover:underline text-purple-600 dark:text-purple-400">@${mentionUsername}</a>`
      : `<span class="current relative text-purple-600 dark:text-purple-400">@${mentionUsername}</span>`;
    const mentionLinkBuffer = Buffer.from(mentionLink, "utf-8");

    // Apply the offset only when slicing the text
    const actualPosition = adjustedMentionPosition + offset;

    const beforeMention = textBuffer.slice(0, actualPosition);
    const afterMention = textBuffer.slice(actualPosition);

    // Concatenating buffers
    textBuffer = Buffer.concat([
      beforeMention,
      mentionLinkBuffer,
      afterMention,
    ]);

    // Update the offset based on the added mention
    offset += mentionLinkBuffer.length;

    // Store the adjusted position in the new array
    updatedMentionsPositions.push(actualPosition);
  }

  // Convert the final Buffer back to a string
  text = textBuffer.toString("utf-8");

  // Replace urls with anchor tags
  if (withLinks) {
    const urls = embeds
      .map(({ url }) => normalizeLink(url))
      .filter((url, index, self) => self.indexOf(url) === index);

    urls.forEach((url) => {
      let originalUrl = url;
      if (text.includes(`https://www.${url}`)) {
        originalUrl = `https://www.${url}`;
      } else if (text.includes(`https://${url}`)) {
        originalUrl = `https://${url}`;
      } else if (text.includes(`http://${url}`)) {
        originalUrl = `http://${url}`;
      } else if (text.includes(`www.${url}`)) {
        originalUrl = `www.${url}`;
      }

      if (text.includes(`${originalUrl}/`)) {
        originalUrl = `${originalUrl}/`;
      }

      text = text.replace(
        originalUrl,
        `<a class="current relative hover:underline text-purple-600 dark:text-purple-400" href="${
          originalUrl.startsWith("http")
            ? originalUrl
            : `https://${originalUrl}`
        }">${url}</a>`
      );
    });
  } else {
    embeds.forEach(({ url }) => {
      let originalUrl = url;
      if (text.includes(`https://www.${url}`)) {
        originalUrl = `https://www.${url}`;
      } else if (text.includes(`https://${url}`)) {
        originalUrl = `https://${url}`;
      } else if (text.includes(`http://${url}`)) {
        originalUrl = `http://${url}`;
      } else if (text.includes(`www.${url}`)) {
        originalUrl = `www.${url}`;
      }

      if (text.includes(`${originalUrl}/`)) {
        originalUrl = `${originalUrl}/`;
      }
      text = text.replace(originalUrl, "");
    });

    text = text.replace(/(https?:\/\/[^\s]+)/g, "");
  }

  return text;
};
