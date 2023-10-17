import { getEmbedMetadata } from "@/indexer/embeds";
import prisma from "@/lib/prisma";
import { Embed, FarcasterUser } from "@/lib/types";
import { HotCasts, HotCastsForChannel, HotCastsForFid } from "./sql";

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
        {
          topParentCast: {
            startsWith: hash,
          },
          deleted: false,
        },
        {
          parentCast: {
            startsWith: hash,
          },
          deleted: false,
        },
        {
          hash: {
            startsWith: hash,
          },
          deleted: false,
        },
      ],
    },
    include: {
      mentions: true,
    },
  });

  const cast = casts.find((cast) => cast.hash.startsWith(hash));
  if (cast?.parentCast) {
    const parentCasts = await prisma.farcasterCast.findMany({
      where: { hash: cast.parentCast, deleted: false },
      include: {
        mentions: true,
      },
    });
    casts.push(...parentCasts);
  }

  return await getCastsResponse(casts.filter(Boolean));
};

export const getCastsResponseByHotness = async (
  page: number,
  onlyParents: boolean,
  parentUrl?: string,
  viewerFid?: number
) => {
  const results: FidHash[] = parentUrl
    ? await HotCastsForChannel(parentUrl, page, onlyParents)
    : viewerFid
    ? await HotCastsForFid(viewerFid, page, onlyParents)
    : await HotCasts(page, onlyParents);

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

  return await getCastsResponse(orderedCasts.filter(Boolean));
};

export const getTimeInterval = (
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
      return "100 years";
    default:
      return "24 hours";
  }
};

export const getCastsResponseByTopLikes = async (
  page: number,
  replies: boolean,
  time: "hour" | "day" | "week" | "month" | "year" | "all",
  parentUrl?: string,
  fid?: number,
  url?: string,
  query?: string
) => {
  const timeInterval = getTimeInterval(time);

  const results: FidHash[] = await (query
    ? fid
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
        AND "FarcasterCast"."text" ILIKE ${`%${query}%`}
        AND "FarcasterCast"."fid" = ${fid}
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
        AND "FarcasterCast"."timestamp" >= NOW() -  ${timeInterval}::interval
        AND "FarcasterCast"."text" ILIKE ${`%${query}%`}
        AND NOT "FarcasterCast"."deleted"
    GROUP BY "targetFid", "targetHash"
    ORDER BY COUNT(*) DESC, "targetFid" DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `
    : parentUrl
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
    : url
    ? prisma.$queryRaw`
    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        COUNT(*) as count
    FROM "public"."FarcasterCastReaction"
      JOIN "public"."FarcasterCastEmbedUrl" ON "FarcasterCastEmbedUrl"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCastEmbedUrl"."hash" = "FarcasterCastReaction"."targetHash"
    WHERE
        "reactionType" = 'like'
        AND "FarcasterCastEmbedUrl"."timestamp" >= NOW() - ${timeInterval}::interval
      AND "FarcasterCastEmbedUrl"."url" LIKE ${`%${url}%`}
      AND "FarcasterCastEmbedUrl"."parsed" = true
      AND NOT "FarcasterCastEmbedUrl"."deleted"
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

  return await getCastsResponse(orderedCasts.filter(Boolean));
};

export const getCastsResponseByNewness = async (
  page: number,
  replies: boolean,
  parentUrl?: string,
  fid?: number,
  url?: string,
  query?: string
) => {
  if (url) {
    const fidHashes: FidHash[] = await prisma.$queryRaw`
      SELECT
        "FarcasterCastEmbedUrl"."fid",
        "FarcasterCastEmbedUrl"."hash",
        MAX("FarcasterCastEmbedUrl"."timestamp") AS timestamp
      FROM "public"."FarcasterCastEmbedUrl"
      WHERE
        "FarcasterCastEmbedUrl"."url" LIKE ${`%${url}%`}
        AND "FarcasterCastEmbedUrl"."parsed" = true
      GROUP BY 1, 2
      ORDER BY "timestamp" DESC
      LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
    `;

    const casts = await getCastsByFidHashes(
      fidHashes.map((cast) => ({
        fid: cast.fid,
        hash: cast.hash,
      }))
    );

    return await getCastsResponse(
      casts
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .filter(Boolean)
    );
  } else {
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
        ...(query ? { text: { contains: query, mode: "insensitive" } } : {}),
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

    return await getCastsResponse(casts.filter(Boolean));
  }
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

  return await getCastsResponse(casts.filter(Boolean));
};

export const getCastsResponse = async (casts: any) => {
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
  const [users, followers, following] = await Promise.all([
    prisma.farcaster.findMany({
      where: {
        fid: {
          in: fids,
        },
      },
    }),
    prisma.farcasterLink.groupBy({
      by: ["targetFid"],
      where: {
        linkType: "follow",
        targetFid: {
          in: fids,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.farcasterLink.groupBy({
      by: ["fid"],
      where: {
        linkType: "follow",
        fid: {
          in: fids,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);
  const followingMap = following.reduce((acc, following) => {
    acc[following.fid] = following._count._all;
    return acc;
  }, {} as Record<number, number>);
  const followersMap = followers.reduce((acc, follower) => {
    acc[follower.targetFid] = follower._count._all;
    return acc;
  }, {} as Record<number, number>);
  return users.reduce((acc, user) => {
    acc[user.fid] = {
      fid: user.fid,
      fname: user.fname || undefined,
      pfp: user.pfp || undefined,
      display: user.display || undefined,
      bio: user.bio || undefined,
      following: followingMap[user.fid] || 0,
      followers: followersMap[user.fid] || 0,
    };
    return acc;
  }, {} as Record<number, FarcasterUser>);
};

export const getCastsByFidHashes = async (fidHashes: FidHash[]) => {
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
        parsed: false,
      })),
    },
  });

  const embedsToFetch = urlEmbeds.filter(
    ({ url, contentMetadata, contentType }: any) => {
      if (!url) return false;
      if (!contentMetadata) return true;
      if (
        contentType &&
        (contentType.includes("image") || contentType.includes("video"))
      )
        return false;
      if (Object.keys(contentMetadata).length > 0) {
        if (
          (url.includes("warpcast.com") || url.includes("flink.fyi")) &&
          url.match(/0x[0-9a-fA-F]+$/i)
        ) {
          return !contentMetadata["user"];
        }
        return false;
      }
      return url.startsWith("chain://");
    }
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
      url: embed.url.startsWith("http") ? embed.url : `https://${embed.url}`,
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
