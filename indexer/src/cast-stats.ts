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

const run = async () => {
  const parentUrls = await prisma.farcasterCast.findMany({
    where: {
      parentUrl: {
        not: null,
      },
    },
    select: {
      parentUrl: true,
    },
    distinct: ["parentUrl"],
  });

  const channels = parentUrls
    .map((p) => p.parentUrl)
    .filter(Boolean) as string[];

  console.log(`[cast-stats] [channels] processing ${channels.length} channels`);

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
    WHERE "FarcasterCast"."timestamp" > NOW() - INTERVAL '3 hour'
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
    WHERE "FarcasterCast"."timestamp" > NOW() - INTERVAL '3 hour'
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

run();
