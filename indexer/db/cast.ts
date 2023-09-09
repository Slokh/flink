import { FarcasterCast } from "@prisma/client";
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

interface Content {
  contentType?: string;
  contentLength?: number;
  contentLastModified?: Date;
}

export interface CastEmbedUrl extends Content {
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

const BATCH_SIZE = 2000;

export const getCast = async (fid: number, hash: string) => {
  return await prisma.farcasterCast.findUnique({
    where: { fid_hash: { fid, hash } },
  });
};

export const upsertCastDatas = async (castDatas: CastData[]) => {
  const casts = castDatas.map(({ cast }) => cast);
  const castMentions = castDatas.map(({ castMentions }) => castMentions).flat();
  const castEmbedCasts = castDatas
    .map(({ castEmbedCasts }) => castEmbedCasts)
    .flat();
  const castEmbedUrls = castDatas
    .map(({ castEmbedUrls }) => castEmbedUrls)
    .flat();

  await deleteCasts(casts);
  await upsertCasts(casts);

  await Promise.all([
    upsertCastMentions(castMentions),
    upsertCastEmbedCasts(castEmbedCasts),
    upsertCastEmbedUrls(castEmbedUrls),
  ]);

  return casts;
};

export const getExistingCasts = async (casts: CastData[]) => {
  const fetchedCasts: FarcasterCast[] = [];
  for (let i = 0; i < casts.length; i += BATCH_SIZE) {
    const batch = casts.slice(i, i + BATCH_SIZE);
    fetchedCasts.push(
      ...(await prisma.farcasterCast.findMany({
        where: {
          OR: batch.map(({ fid, hash }) => ({ fid, hash, deleted: false })),
        },
      }))
    );
  }
  return fetchedCasts;
};

export const upsertCasts = async (casts: Cast[]) => {
  for (let i = 0; i < casts.length; i += BATCH_SIZE) {
    const batch = casts.slice(i, i + BATCH_SIZE);
    await prisma.farcasterCast.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const upsertCastMentions = async (castMentions: CastMention[]) => {
  for (let i = 0; i < castMentions.length; i += BATCH_SIZE) {
    const batch = castMentions.slice(i, i + BATCH_SIZE);
    await prisma.farcasterCastMention.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const upsertCastEmbedCasts = async (castEmbedCasts: CastEmbedCast[]) => {
  for (let i = 0; i < castEmbedCasts.length; i += BATCH_SIZE) {
    const batch = castEmbedCasts.slice(i, i + BATCH_SIZE);
    await prisma.farcasterCastEmbedCast.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const upsertCastEmbedUrls = async (castEmbedUrls: CastEmbedUrl[]) => {
  const castEmbedUrlsWithMimeTypes = await Promise.all(
    castEmbedUrls.map(async (castEmbedUrl) => {
      const mimeType = await getMimeType(castEmbedUrl.url);
      return {
        ...castEmbedUrl,
        ...mimeType,
      };
    })
  );

  for (let i = 0; i < castEmbedUrlsWithMimeTypes.length; i += BATCH_SIZE) {
    const batch = castEmbedUrlsWithMimeTypes.slice(i, i + BATCH_SIZE);
    await prisma.farcasterCastEmbedUrl.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const deleteCasts = async (casts: Cast[]) => {
  for (let i = 0; i < casts.length; i += BATCH_SIZE) {
    const batch = casts.slice(i, i + BATCH_SIZE);
    await prisma.farcasterCast.deleteMany({
      where: {
        OR: batch.map(({ fid, hash }) => ({ fid, hash, deleted: false })),
      },
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

async function getMimeType(url: string): Promise<Content | undefined> {
  try {
    const response = await fetch(`https://${url}`, { method: "HEAD" });
    if (response.ok) {
      const headers = response.headers;
      const contentType = headers.get("Content-Type");
      const contentLength = headers.get("Content-Length");
      const lastModified = headers.get("Last-Modified");
      return {
        contentType: contentType ? contentType : undefined,
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        contentLastModified: lastModified ? new Date(lastModified) : undefined,
      };
    }
  } catch (error) {}
}
