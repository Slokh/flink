import prisma from "../lib/prisma";

export interface CastReaction {
  fid: number;
  timestamp: Date;
  targetHash: string;
  targetFid: number;
  reactionType: "like" | "recast";
}

export interface UrlReaction {
  fid: number;
  timestamp: Date;
  targetUrl: string;
  reactionType: "like" | "recast";
}

export const upsertCastReactions = async (reactions: CastReaction[]) => {
  await prisma.farcasterCastReaction.createMany({
    data: reactions,
    skipDuplicates: true,
  });
};

export const upsertUrlReactions = async (reactions: UrlReaction[]) => {
  await prisma.farcasterUrlReaction.createMany({
    data: reactions,
    skipDuplicates: true,
  });
};

export const deleteCastReaction = async (reaction: CastReaction) => {
  await prisma.farcasterCastReaction.upsert({
    where: {
      fid_targetHash_targetFid_reactionType: {
        fid: reaction.fid,
        targetHash: reaction.targetHash,
        targetFid: reaction.targetFid,
        reactionType: reaction.reactionType,
      },
    },
    create: {
      ...reaction,
      deleted: true,
    },
    update: { deleted: true },
  });
};

export const deleteUrlReaction = async (reaction: UrlReaction) => {
  await prisma.farcasterUrlReaction.upsert({
    where: {
      fid_targetUrl_reactionType: {
        fid: reaction.fid,
        targetUrl: reaction.targetUrl,
        reactionType: reaction.reactionType,
      },
    },
    create: {
      ...reaction,
      deleted: true,
    },
    update: { deleted: true },
  });
};
