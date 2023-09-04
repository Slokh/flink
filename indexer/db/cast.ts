import prisma from "../lib/prisma";

export interface Cast {
  hash: string;
  fid: number;
  timestamp: Date;
  parent?: string;
  parentFid?: number;
  parentType?: "cast" | "url";
  text: string;
}

export interface CastEmbed {
  hash: string;
  fid: number;
  content: string;
  contentFid: number;
  contentType: "cast" | "url";
  parsed: boolean;
}

export interface CastMention {
  hash: string;
  fid: number;
  mention: number;
  mentionPosition: number;
}

export interface Reaction {
  target: string;
  fid: number;
  reactionType: "like" | "recast";
  targetFid: number;
  targetType: "cast" | "url";
  timestamp: Date;
}

export interface CastData {
  fid: number;
  hash: string;
  rawHash: Uint8Array;
  cast: Cast;
  castMentions: CastMention[];
  castEmbeds: CastEmbed[];
  customEmbeds: CastEmbed[];
}

export const upsertCast = async ({
  cast,
  castMentions,
  castEmbeds,
  customEmbeds,
}: CastData) => {
  await prisma.farcasterCast.upsert({
    where: { fid_hash: { fid: cast.fid, hash: cast.hash } },
    update: cast,
    create: cast,
  });
  await Promise.all([
    prisma.farcasterCastMention.createMany({
      data: castMentions,
      skipDuplicates: true,
    }),
    prisma.farcasterCastEmbed.createMany({
      data: castEmbeds.concat(customEmbeds),
      skipDuplicates: true,
    }),
  ]);
};

export const bulkUpsertCasts = async (data: CastData[]) => {
  const casts = data.map((d) => d?.cast).filter(Boolean) as Cast[];

  const batchSize = 10000;
  for (let i = 0; i < casts.length; i += batchSize) {
    const batch = casts.slice(i, i + batchSize);
    await prisma.farcasterCast.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  const mentions = data
    .map((d) => d?.castMentions)
    .flat()
    .filter(Boolean) as CastMention[];
  for (let i = 0; i < mentions.length; i += batchSize) {
    const batch = mentions.slice(i, i + batchSize);
    await prisma.farcasterCastMention.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  const embeds = data
    .map((d) => d?.castEmbeds)
    .flat()
    .filter(Boolean) as CastEmbed[];
  for (let i = 0; i < embeds.length; i += batchSize) {
    const batch = embeds.slice(i, i + batchSize);
    await prisma.farcasterCastEmbed.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const upsertReaction = async (reaction: Reaction) => {
  await prisma.farcasterCastReaction.upsert({
    where: {
      fid_target_reactionType: {
        fid: reaction.fid,
        target: reaction.target,
        reactionType: reaction.reactionType,
      },
    },
    update: reaction,
    create: reaction,
  });
};

export const bulkUpsertReactions = async (reactions: Reaction[]) => {
  const batchSize = 10000;
  for (let i = 0; i < reactions.length; i += batchSize) {
    const batch = reactions.slice(i, i + batchSize);
    await prisma.farcasterCastReaction.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const deleteCast = async (hash: string, fid: number) => {
  await Promise.all([
    prisma.farcasterCast.updateMany({
      where: { fid, hash },
      data: { deleted: true },
    }),
    prisma.farcasterCastEmbed.updateMany({
      where: { hash, fid },
      data: { deleted: true },
    }),
    prisma.farcasterCastMention.updateMany({
      where: { hash, fid },
      data: { deleted: true },
    }),
    deleteReaction(hash),
  ]);
};

export const deleteReaction = async (target: string) => {
  await prisma.farcasterCastReaction.updateMany({
    where: { target },
    data: { deleted: true },
  });
};

export const resetFid = async (fid: number) => {
  await Promise.all([
    prisma.farcasterCastEmbed.deleteMany({
      where: { fid },
    }),
    prisma.farcasterCastMention.deleteMany({
      where: { fid },
    }),
    prisma.farcasterCastReaction.deleteMany({
      where: { targetFid: fid },
    }),
  ]);

  await prisma.farcasterCast.deleteMany({
    where: { fid },
  });
};
