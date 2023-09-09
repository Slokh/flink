import prisma from "../lib/prisma";
import { Cast, CastData } from "./cast";

export interface Keyword {
  fid: number;
  hash: string;
  timestamp: Date;
  keyword: string;
  score: number;
}

const BATCH_SIZE = 2000;

export const upsertKeywords = async (keywords: Keyword[]) => {
  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);
    await prisma.farcasterCastKeyword.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};
