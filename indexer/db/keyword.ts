import prisma from "../lib/prisma";
import { CastData } from "./cast";

export interface Keyword {
  fid: number;
  hash: string;
  timestamp: Date;
  keyword: string;
  score: number;
}

const BATCH_SIZE = 5000;

export const upsertKeywords = async (keywords: Keyword[]) => {
  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);
    await prisma.farcasterCastKeyword.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const getCastsMissingKeywords = async (casts: CastData[]) => {
  const castIds = casts.map((cast) => ({
    fid: cast.fid,
    hash: cast.hash,
  }));

  const batches = [];
  for (let i = 0; i < castIds.length; i += BATCH_SIZE) {
    batches.push(castIds.slice(i, i + BATCH_SIZE));
  }

  const existingKeywords = (
    await Promise.all(
      batches.map((batch) =>
        prisma.farcasterCastKeyword.findMany({
          where: {
            OR: batch,
          },
          select: {
            fid: true,
            hash: true,
          },
          distinct: ["fid", "hash"],
        })
      )
    )
  ).flat();

  const existingKeywordsMap = existingKeywords.reduce((acc, cur) => {
    acc[`${cur.fid}-${cur.hash}`] = true;
    return acc;
  }, {} as Record<string, boolean>);

  return casts.filter(
    (cast) => !existingKeywordsMap[`${cast.fid}-${cast.hash}`]
  );
};
