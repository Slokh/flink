import prisma from "../lib/prisma";

export interface Cast {
  fid: number;
  hash: string;
  timestamp: Date;
  topParentCast?: string;
  topParentFid?: number;
  topParentUrl?: string;
  parentCast?: string;
  parentFid?: number;
  parentUrl?: string;
  text: string;
}

export interface CastEmbedUrl {
  fid: number;
  hash: string;
  timestamp: Date;
  url: string;
  urlHost: string;
  urlPath?: string;
  urlParams?: string;
  parsed: boolean;
}
export interface CastEmbedCast {
  fid: number;
  hash: string;
  timestamp: Date;
  embedHash: string;
  embedFid: number;
}

export interface CastMention {
  fid: number;
  hash: string;
  timestamp: Date;
  mention: number;
  mentionPosition: number;
}

export interface CastData {
  fid: number;
  hash: string;
  cast: Cast;
  castMentions: CastMention[];
  castEmbedCasts: CastEmbedCast[];
  castEmbedUrls: CastEmbedUrl[];
}

export const upsertCastDatas = async (castDatas: CastData[]) => {
  const casts = castDatas.map(({ cast }) => cast);
  await upsertCasts(casts);

  const castMentions = castDatas.map(({ castMentions }) => castMentions).flat();

  const castEmbedCasts = castDatas
    .map(({ castEmbedCasts }) => castEmbedCasts)
    .flat();

  const castEmbedUrls = castDatas
    .map(({ castEmbedUrls }) => castEmbedUrls)
    .flat();

  await Promise.all([
    upsertCastMentions(castMentions),
    upsertCastEmbedCasts(castEmbedCasts),
    upsertCastEmbedUrls(castEmbedUrls),
  ]);
};

export const getCast = async (fid: number, hash: string) => {
  return await prisma.farcasterCast.findUnique({
    where: { fid_hash: { fid, hash } },
  });
};

export const upsertCasts = async (casts: Cast[]) => {
  await prisma.$transaction(
    casts.map((cast) =>
      prisma.farcasterCast.upsert({
        where: { fid_hash: { fid: cast.fid, hash: cast.hash } },
        create: cast,
        update: cast,
      })
    )
  );
};

export const upsertCastMentions = async (castMentions: CastMention[]) => {
  await prisma.$transaction(
    castMentions.map((castMention) =>
      prisma.farcasterCastMention.upsert({
        where: {
          fid_hash_mention: {
            fid: castMention.fid,
            hash: castMention.hash,
            mention: castMention.mention,
          },
        },
        create: castMention,
        update: castMention,
      })
    )
  );
};

export const upsertCastEmbedCasts = async (castEmbedCasts: CastEmbedCast[]) => {
  await prisma.$transaction(
    castEmbedCasts.map((castEmbedCast) =>
      prisma.farcasterCastEmbedCast.upsert({
        where: {
          fid_hash_embedHash_embedFid: {
            fid: castEmbedCast.fid,
            hash: castEmbedCast.hash,
            embedFid: castEmbedCast.embedFid,
            embedHash: castEmbedCast.embedHash,
          },
        },
        create: castEmbedCast,
        update: castEmbedCast,
      })
    )
  );
};

export const upsertCastEmbedUrls = async (castEmbedUrls: CastEmbedUrl[]) => {
  await prisma.$transaction(
    castEmbedUrls.map((castEmbedUrl) =>
      prisma.farcasterCastEmbedUrl.upsert({
        where: {
          fid_hash_url: {
            fid: castEmbedUrl.fid,
            hash: castEmbedUrl.hash,
            url: castEmbedUrl.url,
          },
        },
        create: castEmbedUrl,
        update: castEmbedUrl,
      })
    )
  );
};

export const deleteCast = async (fid: number, hash: string) => {
  await Promise.all([
    prisma.farcasterCast.updateMany({
      where: { fid, hash },
      data: { deleted: true },
    }),
    prisma.farcasterCastMention.updateMany({
      where: { fid, hash },
      data: { deleted: true },
    }),
    prisma.farcasterCastEmbedCast.updateMany({
      where: { fid, hash },
      data: { deleted: true },
    }),
    prisma.farcasterCastEmbedUrl.updateMany({
      where: { fid, hash },
      data: { deleted: true },
    }),
    prisma.farcasterCastReaction.updateMany({
      where: { targetFid: fid, targetHash: hash },
      data: { deleted: true },
    }),
  ]);
};
