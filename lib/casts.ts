import { getEmbedMetadata } from "@/indexer/embeds";
import prisma from "@/lib/prisma";
import { Embed, FarcasterUser } from "@/lib/types";
import { subHours } from "date-fns";
import { NextResponse } from "next/server";

const PAGE_SIZE = 5;

interface FidHash {
  fid: number;
  hash: string;
}

export const getCastsResponseByTopLikes = async (page: number) => {
  console.log(subHours(new Date(), 24));
  const topCasts = await prisma.farcasterCastReaction.groupBy({
    by: ["targetFid", "targetHash"],
    where: {
      reactionType: "like",
      timestamp: {
        gte: subHours(new Date(), 24),
      },
    },
    _count: true,
    orderBy: {
      _count: {
        targetFid: "desc",
      },
    },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const casts = await getCastsByFidHashes(
    topCasts.map((cast) => ({
      fid: cast.targetFid,
      hash: cast.targetHash,
    }))
  );

  return await getCastsResponse(casts, false);
};

export const getCastsResponseByFid = async (
  page: number,
  fid?: number,
  withReplies = true
) => {
  const casts = await prisma.farcasterCast.findMany({
    where: {
      ...(fid ? { fid } : {}),
      ...(!withReplies
        ? {
            parentCast: {
              equals: null,
            },
          }
        : {}),
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

  return await getCastsResponse(casts, withReplies);
};

const getCastsResponse = async (casts: any, withReplies: boolean) => {
  let allCasts = casts;
  if (withReplies) {
    allCasts = allCasts.concat(
      await getCastsByFidHashes(getAdjacentCastFidHashes(casts))
    );
  }

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

  return NextResponse.json(
    casts.map((cast: any) => ({
      user: userMap[cast.fid],
      hash: cast.hash,
      timestamp: cast.timestamp.toISOString(),
      parentCast:
        cast.parentFid && cast.parentCast
          ? castMap[`${cast.parentFid}-${cast.parentCast}`]
          : undefined,
      parentUrl: cast.parentUrl || undefined,
      topParentCast:
        cast.topParentFid && cast.topParentCast
          ? castMap[`${cast.topParentFid}-${cast.topParentCast}`]
          : undefined,
      topParentUrl: cast.topParentUrl || undefined,
      text: cast.text,
      mentions: cast.mentions.map((mention: any) => ({
        mention: userMap[mention.mention],
        position: mention.mentionPosition,
      })),
      embeds: embedMap[`${cast.fid}-${cast.hash}`] || [],
      likes: likeMap[`${cast.fid}-${cast.hash}`] || 0,
      recasts: recastMap[`${cast.fid}-${cast.hash}`] || 0,
      replies: replyMap[`${cast.fid}-${cast.hash}`] || 0,
    }))
  );
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

const getAdjacentCastFidHashes = (casts: any) => {
  const fidHashes: Record<string, FidHash> = {};
  for (const cast of casts) {
    fidHashes[`${cast.fid}-${cast.hash}`] = {
      fid: cast.fid,
      hash: cast.hash,
    };
    if (cast.parentFid && cast.parentCast) {
      fidHashes[`${cast.parentFid}-${cast.parentCast}`] = {
        fid: cast.parentFid,
        hash: cast.parentCast,
      };
    }
    if (cast.topParentFid && cast.topParentCast) {
      fidHashes[`${cast.topParentFid}-${cast.topParentCast}`] = {
        fid: cast.topParentFid,
        hash: cast.topParentCast,
      };
    }
  }
  return Object.values(fidHashes);
};

const getRelevantFids = (casts: any) => {
  const fids: Record<number, boolean> = {};
  for (const cast of casts) {
    fids[cast.fid] = true;
    cast.mentions.forEach((mention: any) => {
      fids[mention.mention] = true;
    });
  }
  return Object.keys(fids).map((fid) => parseInt(fid));
};

const getRepliesForCast = async (casts: any) => {
  const replyCounts = await prisma.farcasterCast.groupBy({
    by: ["parentFid", "parentCast"],
    where: {
      OR: casts.map((cast: any) => ({
        parentFid: cast.fid,
        parentCast: cast.hash,
      })),
    },
    _count: true,
  });

  return replyCounts.reduce((acc: any, replyCount: any) => {
    acc[`${replyCount.parentFid}-${replyCount.parentCast}`] = replyCount._count;
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
      parsed: false,
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
      url: embed.url,
      metadata: embed.contentMetadata || fetchedEmbedsMap[embed.url],
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
      })),
    },
    _count: true,
  });

  return reactions.reduce((acc, reaction) => {
    acc[`${reaction.targetFid}-${reaction.targetHash}`] = reaction._count;
    return acc;
  }, {} as Record<string, number>);
};
