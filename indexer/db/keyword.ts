import prisma from "../lib/prisma";
import { CastData } from "./cast";

export interface Keyword {
  fid: number;
  hash: string;
  timestamp: Date;
  keyword: string;
  score: number;
}

export const upsertKeywords = async (keywords: Keyword[]) => {
  await prisma.$transaction(
    keywords.map((keyword) =>
      prisma.farcasterCastKeyword.upsert({
        where: {
          fid_hash_keyword: {
            fid: keyword.fid,
            hash: keyword.hash,
            keyword: keyword.keyword,
          },
        },
        create: keyword,
        update: keyword,
      })
    )
  );
};

export const getCastsMissingKeywords = async (casts: CastData[]) => {
  const where = {
    OR: casts.map((cast) => ({
      fid: cast.fid,
      hash: cast.hash,
    })),
  };

  const existingKeywords = await prisma.farcasterCastKeyword.findMany({
    where,
    select: {
      fid: true,
      hash: true,
    },
    distinct: ["fid", "hash"],
  });

  const existingKeywordsMap = existingKeywords.reduce((acc, cur) => {
    acc[`${cur.fid}-${cur.hash}`] = true;
    return acc;
  }, {} as Record<string, boolean>);

  return casts.filter(
    (cast) => !existingKeywordsMap[`${cast.fid}-${cast.hash}`]
  );
};
