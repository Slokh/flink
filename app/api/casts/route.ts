import { CHAIN_ID_TO_NAME } from "@/indexer/util";
import prisma from "@/lib/prisma";
import { Embed, FarcasterCast, FarcasterUser } from "@/lib/types";
import { NextResponse } from "next/server";
import { unfurl } from "unfurl.js";

const PAGE_SIZE = 20;

interface FidHash {
  fid: number;
  hash: string;
}

export async function GET(
  request: Request
): Promise<NextResponse<FarcasterCast[]>> {
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get("page") || "1");
  const fid = url.searchParams.get("fid");

  const casts = await getCastsByFid(
    page,
    fid ? parseInt(fid) : undefined,
    false
  );
  const adjacentCasts = await getCastsByFidHashes(
    getAdjacentCastFidHashes(casts)
  );

  const castMap = casts.concat(adjacentCasts).reduce((acc, cast) => {
    acc[`${cast.fid}-${cast.hash}`] = cast;
    return acc;
  }, {} as Record<string, any>);

  const relevantFids = getRelevantFids(Object.values(castMap));
  const urls = casts.flatMap((cast) =>
    cast.urlEmbeds.filter(({ parsed }) => !parsed).map(({ url }: any) => url)
  );

  const [userMap, embedMap, likeMap, recastMap] = await Promise.all([
    getUsersByFids(relevantFids),
    getEmbedsForUrls(urls),
    getReactionsForCasts(casts, "like"),
    getReactionsForCasts(casts, "recast"),
  ]);

  await getReactionsForCasts(casts, "like");

  return NextResponse.json(
    casts.map((cast) => ({
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
      urlEmbeds: cast.urlEmbeds
        .filter(({ parsed }) => !parsed)
        .map(({ url }) => url),
      castEmbeds: cast.castEmbeds.map(
        (embed: any) => castMap[`${embed.fid}-${embed.hash}`]
      ),
      embeds: cast.urlEmbeds
        .filter(({ parsed }) => !parsed)
        .map(({ url }) => embedMap[url]),
      likes: likeMap[`${cast.fid}-${cast.hash}`] || 0,
      recasts: recastMap[`${cast.fid}-${cast.hash}`] || 0,
    }))
  );
}

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

const getCastsByFid = async (
  page: number,
  fid?: number,
  withReplies = true
) => {
  return await prisma.farcasterCast.findMany({
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
      urlEmbeds: true,
      castEmbeds: true,
      mentions: true,
    },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });
};

const getCastsByFidHashes = async (fidHashes: FidHash[]) => {
  return await prisma.farcasterCast.findMany({
    where: {
      OR: fidHashes,
    },
    include: {
      urlEmbeds: true,
      castEmbeds: true,
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
    cast.castEmbeds.forEach(({ embedFid, embedHash }: any) => {
      fidHashes[`${embedFid}-${embedHash}`] = {
        fid: embedFid,
        hash: embedHash,
      };
    });
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

const getEmbedsForUrls = async (urls: string[]) => {
  const embeds: Embed[] = await Promise.all(
    urls.map(async (url: string) => {
      try {
        if (url.startsWith("chain://")) {
          const [, , chainId, contractAddress, tokenId] = url.split("/");
          const response = await fetch(
            `https://api.simplehash.com/api/v0/nfts/${
              CHAIN_ID_TO_NAME[chainId]
            }/${contractAddress.split(":")[1]}/${tokenId}`,
            {
              headers: {
                "X-API-KEY": process.env.SIMPLEHASH_API_KEY as string,
              },
            }
          );
          const {
            name,
            description,
            collection: { marketplace_pages },
            previews: { image_opengraph_url },
          } = await response.json();

          const openseaUrl = marketplace_pages.find(
            ({ nft_url }: { nft_url: string }) => nft_url.includes("opensea")
          )?.nft_url;

          return {
            url,
            type: "nft",
            nftMetadata: {
              name,
              description,
              image: image_opengraph_url,
              externalUrl: openseaUrl,
            },
          };
        }
        return {
          url,
          type: "url",
          urlMetadata: await unfurl(url),
        };
      } catch (e) {
        return {
          url,
          type: "media",
        };
      }
    })
  );
  return embeds.reduce((acc, embed) => {
    acc[embed.url] = embed;
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
