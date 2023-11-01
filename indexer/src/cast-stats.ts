import prisma from "../lib/prisma";

type Reactions = {
  url: string;
  timestamp: Date;
  likes: number;
  recasts: number;
};

type Counts = {
  url: string;
  timestamp: Date;
  posts: number;
  replies: number;
};

type Stats = Reactions & Counts;

type UserReactions = {
  fid: number;
  url: string;
  timestamp: Date;
  likes: number;
  recasts: number;
};

type UserReacted = {
  fid: number;
  url: string;
  timestamp: Date;
  liked: number;
  recasted: number;
};

type UserMentions = {
  fid: number;
  url: string;
  timestamp: Date;
  mentions: number;
};

type UserCounts = {
  fid: number;
  url: string;
  timestamp: Date;
  posts: number;
  replies: number;
};

type UserStats = UserReactions & UserCounts & UserMentions & UserReacted;

const run = async () => {
  console.log(`[cast-stats] [channels] processing channels`);

  const stats = await getStats();

  console.log(
    `[cast-stats] [channels] processing ${stats.length} stats in ${
      stats.length / 1000
    } batches`
  );

  for (let i = 0; i < stats.length; i += 1000) {
    const batch = stats.slice(i, i + 1000);
    console.log(`[cast-stats] [channels] processing batch ${i}`);
    await prisma.farcasterChannelStats.deleteMany({
      where: {
        OR: batch.map((s) => ({
          url: s.url,
          timestamp: s.timestamp,
        })),
      },
    });
    await prisma.farcasterChannelStats.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  console.log(`[cast-stats] [users] processing fid`);
  const userStats = await getUserStats();

  console.log(
    `[cast-stats] [users] processing ${userStats.length} stats in ${
      userStats.length / 1000
    } batches`
  );

  for (let i = 0; i < userStats.length; i += 1000) {
    const batch = userStats.slice(i, i + 1000);
    console.log(`[user-stats] [users] processing batch ${i}`);
    await prisma.farcasterUserStats.deleteMany({
      where: {
        OR: batch.map((s) => ({
          fid: s.fid,
          url: s.url,
          timestamp: s.timestamp,
        })),
      },
    });
    await prisma.farcasterUserStats.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

const getStats = async () => {
  const [reactions, counts] = await Promise.all([getReactions(), getCounts()]);

  // distinct keys between reactions and counts
  const keys = Object.keys(reactions)
    .concat(Object.keys(counts))
    .filter((v, i, a) => a.indexOf(v) === i);

  const stats = keys.map((k) => {
    const reaction = reactions[k];
    const count = counts[k];
    return {
      ...reaction,
      ...count,
    } as Stats;
  });

  return stats;
};

const getReactions = async () => {
  const reactions: any[] = await prisma.$queryRaw`
    SELECT
      "FarcasterCast"."topParentUrl",
      date_trunc('hour', "FarcasterCastReaction"."timestamp") + INTERVAL '1 hour' as date,
      SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'like' THEN 1 ELSE 0 END) as likes,
      SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'recast' THEN 1 ELSE 0 END) as recasts
    FROM "public"."FarcasterCast"
      JOIN "public"."FarcasterCastReaction" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
    WHERE NOT "FarcasterCastReaction"."deleted"
      AND "FarcasterCastReaction"."timestamp" > NOW() - INTERVAL '3 day'
    GROUP BY
      "topParentUrl", date
  `;

  return reactions.reduce((acc: any, c: any) => {
    const url = c.topParentUrl || "uncategorized";
    const key = `${url}-${c.date}`;
    acc[key] = {
      url,
      timestamp: new Date(c.date),
      likes: parseInt(c.likes),
      recasts: parseInt(c.recasts),
    };
    return acc;
  }, {} as Record<string, Reactions>);
};

const getCounts = async () => {
  const counts: any[] = await prisma.$queryRaw`
    SELECT
      "FarcasterCast"."topParentUrl",
      date_trunc('hour', "FarcasterCast"."timestamp") + INTERVAL '1 hour' as date,
      SUM(CASE WHEN "FarcasterCast"."parentCast" IS NULL THEN 1 ELSE 0 END) as posts,
      SUM(CASE WHEN "FarcasterCast"."parentCast" IS NOT NULL THEN 1 ELSE 0 END) as replies
    FROM "public"."FarcasterCast"
    WHERE NOT "FarcasterCast"."deleted"
      AND "FarcasterCast"."timestamp" > NOW() - INTERVAL '3 day'
    GROUP BY
      "topParentUrl", date
  `;

  return counts.reduce((acc: any, c: any) => {
    const url = c.topParentUrl || "uncategorized";
    const key = `${url}-${c.date}`;
    acc[key] = {
      url,
      timestamp: new Date(c.date),
      posts: parseInt(c.posts),
      replies: parseInt(c.replies),
    };
    return acc;
  }, {} as Record<string, Counts>);
};

const getUserStats = async () => {
  const [reactions, counts, reacted, mentions] = await Promise.all([
    getUserReactions(),
    getUserCounts(),
    getUserReacted(),
    getUserMentions(),
  ]);

  // distinct keys between reactions and counts
  const keys = Object.keys(reactions)
    .concat(Object.keys(counts))
    .filter((v, i, a) => a.indexOf(v) === i);

  const stats = keys.map((k) => {
    const reaction = reactions[k];
    const count = counts[k];
    const react = reacted[k];
    const mention = mentions[k];
    return {
      ...reaction,
      ...count,
      ...react,
      ...mention,
    } as UserStats;
  });

  return stats;
};

const getUserReactions = async () => {
  const reactions: any[] = await prisma.$queryRaw`
    SELECT
      "FarcasterCastReaction"."targetFid" AS fid,
      "FarcasterCast"."topParentUrl",
      date_trunc('hour', "FarcasterCastReaction"."timestamp") + INTERVAL '1 hour' as date,
      SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'like' THEN 1 ELSE 0 END) as likes,
      SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'recast' THEN 1 ELSE 0 END) as recasts
    FROM "public"."FarcasterCast"
      JOIN "public"."FarcasterCastReaction" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
    WHERE NOT "FarcasterCastReaction"."deleted"
      AND "FarcasterCastReaction"."timestamp" > NOW() - INTERVAL '3 day'
    GROUP BY
      "FarcasterCastReaction"."targetFid", "topParentUrl", date
  `;

  return reactions.reduce((acc: any, c: any) => {
    const url = c.topParentUrl || "uncategorized";
    const key = `${c.fid} -${url}-${c.date}`;
    acc[key] = {
      fid: c.fid,
      url,
      timestamp: new Date(c.date),
      likes: parseInt(c.likes),
      recasts: parseInt(c.recasts),
    };
    return acc;
  }, {} as Record<string, UserReactions>);
};

const getUserReacted = async () => {
  const reactions: any[] = await prisma.$queryRaw`
    SELECT
      "FarcasterCastReaction"."fid" AS fid,
      "FarcasterCast"."topParentUrl",
      date_trunc('hour', "FarcasterCastReaction"."timestamp") + INTERVAL '1 hour' as date,
      SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'like' THEN 1 ELSE 0 END) as liked,
      SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'recast' THEN 1 ELSE 0 END) as recasted
    FROM "public"."FarcasterCast"
      JOIN "public"."FarcasterCastReaction" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
    WHERE NOT "FarcasterCastReaction"."deleted"
      AND "FarcasterCastReaction"."timestamp" > NOW() - INTERVAL '3 day'
    GROUP BY
      "FarcasterCastReaction"."fid", "topParentUrl", date
  `;

  return reactions.reduce((acc: any, c: any) => {
    const url = c.topParentUrl || "uncategorized";
    const key = `${c.fid} -${url}-${c.date}`;
    acc[key] = {
      fid: c.fid,
      url,
      timestamp: new Date(c.date),
      liked: parseInt(c.liked),
      recasted: parseInt(c.recasted),
    };
    return acc;
  }, {} as Record<string, UserReacted>);
};

const getUserCounts = async () => {
  const counts: any[] = await prisma.$queryRaw`
    SELECT
      "FarcasterCast"."fid" AS fid,
      "FarcasterCast"."topParentUrl",
      date_trunc('hour', "FarcasterCast"."timestamp") + INTERVAL '1 hour' as date,
      SUM(CASE WHEN "FarcasterCast"."parentCast" IS NULL THEN 1 ELSE 0 END) as posts,
      SUM(CASE WHEN "FarcasterCast"."parentCast" IS NOT NULL THEN 1 ELSE 0 END) as replies
    FROM "public"."FarcasterCast"
    WHERE NOT "FarcasterCast"."deleted"
      AND "FarcasterCast"."timestamp" > NOW() - INTERVAL '3 day'
    GROUP BY
      "FarcasterCast"."fid", "topParentUrl", date
  `;

  return counts.reduce((acc: any, c: any) => {
    const url = c.topParentUrl || "uncategorized";
    const key = `${c.fid} -${url}-${c.date}`;
    acc[key] = {
      fid: c.fid,
      url,
      timestamp: new Date(c.date),
      posts: parseInt(c.posts),
      replies: parseInt(c.replies),
    };
    return acc;
  }, {} as Record<string, UserCounts>);
};

const getUserMentions = async () => {
  const mentions: any[] = await prisma.$queryRaw`
    SELECT
      "FarcasterCastMention"."mention" AS fid,
      "FarcasterCast"."topParentUrl",
      date_trunc('hour', "FarcasterCastMention"."timestamp") + INTERVAL '1 hour' as date,
      SUM(1) as mentions
    FROM "public"."FarcasterCast"
      JOIN "public"."FarcasterCastMention" ON "FarcasterCast"."fid" = "FarcasterCastMention"."fid" AND "FarcasterCast"."hash" = "FarcasterCastMention"."hash"
    WHERE NOT "FarcasterCastMention"."deleted"
      AND "FarcasterCastMention"."timestamp" > NOW() - INTERVAL '3 day'
    GROUP BY
      "FarcasterCastMention"."mention", "topParentUrl", date
  `;

  return mentions.reduce((acc: any, c: any) => {
    const url = c.topParentUrl || "uncategorized";
    const key = `${c.fid} -${url}-${c.date}`;
    acc[key] = {
      fid: c.fid,
      url,
      timestamp: new Date(c.date),
      mentions: parseInt(c.mentions),
    };
    return acc;
  }, {} as Record<string, UserMentions>);
};

run();
