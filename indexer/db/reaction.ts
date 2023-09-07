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
  await prisma.farcasterCastReaction.update({
    where: {
      fid_targetHash_targetFid_reactionType: {
        fid: reaction.fid,
        targetHash: reaction.targetHash,
        targetFid: reaction.targetFid,
        reactionType: reaction.reactionType,
      },
    },
    data: { deleted: true },
  });
};

export const deleteUrlReaction = async (reaction: UrlReaction) => {
  const record = await prisma.farcasterUrlReaction.findUnique({
    where: {
      fid_targetUrl_reactionType: {
        fid: reaction.fid,
        targetUrl: reaction.targetUrl,
        reactionType: reaction.reactionType,
      },
    },
  });
  if (!record) return;

  await prisma.farcasterUrlReaction.update({
    where: {
      fid_targetUrl_reactionType: {
        fid: reaction.fid,
        targetUrl: reaction.targetUrl,
        reactionType: reaction.reactionType,
      },
    },
    data: { deleted: true },
  });
};
