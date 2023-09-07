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

const BATCH_SIZE = 10000;

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
  const batchSize = 10000;
  for (let i = 0; i < casts.length; i += batchSize) {
    const batch = casts.slice(i, i + batchSize);
    await prisma.farcasterCast.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const upsertCastMentions = async (castMentions: CastMention[]) => {
  const batchSize = 10000;
  for (let i = 0; i < castMentions.length; i += batchSize) {
    const batch = castMentions.slice(i, i + batchSize);
    await prisma.farcasterCastMention.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const upsertCastEmbedCasts = async (castEmbedCasts: CastEmbedCast[]) => {
  const batchSize = 10000;
  for (let i = 0; i < castEmbedCasts.length; i += batchSize) {
    const batch = castEmbedCasts.slice(i, i + batchSize);
    await prisma.farcasterCastEmbedCast.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const upsertCastEmbedUrls = async (castEmbedUrls: CastEmbedUrl[]) => {
  const batchSize = 10000;
  for (let i = 0; i < castEmbedUrls.length; i += batchSize) {
    const batch = castEmbedUrls.slice(i, i + batchSize);
    await prisma.farcasterCastEmbedUrl.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
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
    prisma.farcasterCastKeyword.updateMany({
      where: { fid, hash },
      data: { deleted: true },
    }),
  ]);
};
