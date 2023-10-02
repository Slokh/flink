import prisma from "@/lib/prisma";
import { LinkStats } from "@/lib/types";
import { NextResponse } from "next/server";

const timeToHours: { [key: string]: number } = {
  hour: 1,
  sixHour: 6,
  twelveHour: 12,
  day: 24,
  week: 24 * 7,
  month: 24 * 30,
  year: 24 * 365,
  all: 24 * 365 * 100,
};

function getRank(data: any[], field: string) {
  return data
    .sort((a: any, b: any) => {
      const primarySort = Number(b[field]) - Number(a[field]);
      if (primarySort !== 0) return primarySort;
      return a.url.localeCompare(b.url);
    })
    .reduce((map: any, obj: any, index: number) => {
      map[obj.url] = index + 1;
      return map;
    }, {});
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const time = url.searchParams.get("time") || "year";

  const curHours = timeToHours[time];
  const prevHours = timeToHours[time] * 2;

  const [curData, prevData]: any = await Promise.all([
    prisma.$queryRaw`
      SELECT
          url,
          "contentMetadata",
          posts,
          replies,
          likes,
          recasts,
          (1 * posts + 0.5 * replies + 0.5 * likes + 0.25 * recasts) as engagement
      FROM (
          SELECT
              LOWER(url) AS url,
              (jsonb_agg("contentMetadata"))[1] as "contentMetadata",
              COUNT(DISTINCT CASE WHEN "FarcasterCast"."parentCast" IS NULL THEN "FarcasterCast"."hash" ELSE NULL END) as posts,
              COUNT(DISTINCT CASE WHEN "FarcasterCast"."parentCast" IS NOT NULL THEN "FarcasterCast"."hash" ELSE NULL END) as replies,
              SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'like' THEN 1 ELSE 0 END) as likes,
              SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'recast' THEN 1 ELSE 0 END) as recasts
          FROM "public"."FarcasterCastEmbedUrl"
              JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastEmbedUrl"."fid" AND "FarcasterCast"."hash" = "FarcasterCastEmbedUrl"."hash"
              JOIN "public"."FarcasterCastReaction" ON "FarcasterCastReaction"."targetFid" = "FarcasterCastEmbedUrl"."fid" AND "FarcasterCastReaction"."targetHash" = "FarcasterCastEmbedUrl"."hash"
          WHERE "FarcasterCastReaction"."timestamp" > NOW() - ${`${curHours} hour`}::INTERVAL
              AND "contentType" NOT LIKE 'image%'
              AND parsed AND "url" NOT LIKE 'chain://%'
          GROUP BY LOWER(url)
      ) as subquery
      ORDER BY engagement DESC;
    `,
    prisma.$queryRaw`
      SELECT
          url,
          "contentMetadata",
          posts,
          replies,
          likes,
          recasts,
          (1 * posts + 0.5 * replies + 0.5 * likes + 0.25 * recasts) as engagement
      FROM (
          SELECT
              LOWER(url) AS url,
              (jsonb_agg("contentMetadata"))[1] as "contentMetadata",
              COUNT(DISTINCT CASE WHEN "FarcasterCast"."parentCast" IS NULL THEN "FarcasterCast"."hash" ELSE NULL END) as posts,
              COUNT(DISTINCT CASE WHEN "FarcasterCast"."parentCast" IS NOT NULL THEN "FarcasterCast"."hash" ELSE NULL END) as replies,
              SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'like' THEN 1 ELSE 0 END) as likes,
              SUM(CASE WHEN "FarcasterCastReaction"."reactionType" = 'recast' THEN 1 ELSE 0 END) as recasts
          FROM "public"."FarcasterCastEmbedUrl"
              JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastEmbedUrl"."fid" AND "FarcasterCast"."hash" = "FarcasterCastEmbedUrl"."hash"
              JOIN "public"."FarcasterCastReaction" ON "FarcasterCastReaction"."targetFid" = "FarcasterCastEmbedUrl"."fid" AND "FarcasterCastReaction"."targetHash" = "FarcasterCastEmbedUrl"."hash"
          WHERE "FarcasterCastReaction"."timestamp" > NOW() - ${`${prevHours} hour`}::INTERVAL
              AND "FarcasterCastReaction"."timestamp" < NOW() - ${`${curHours} hour`}::INTERVAL
              AND "contentType" NOT LIKE 'image%'
              AND parsed AND "url" NOT LIKE 'chain://%'
          GROUP BY LOWER(url)
      ) as subquery
      ORDER BY engagement DESC;
    `,
  ]);

  const curLikes = getRank(curData, "likes");
  const prevLikes = getRank(prevData, "likes");
  const curRecasts = getRank(curData, "recasts");
  const prevRecasts = getRank(prevData, "recasts");
  const curReplies = getRank(curData, "replies");
  const prevReplies = getRank(prevData, "replies");
  const curPosts = getRank(curData, "posts");
  const prevPosts = getRank(prevData, "posts");
  const curEngagement = getRank(curData, "engagement");
  const prevEngagement = getRank(prevData, "engagement");

  const response = curData.slice(0, 100).map((cur: any, i: number) => {
    const prev = prevData.find((p: any) => p.url === cur.url);
    return {
      url: cur.url,
      contentMetadata: cur.contentMetadata,
      likes: Number(cur.likes),
      recasts: Number(cur.recasts),
      replies: Number(cur.replies),
      posts: Number(cur.posts),
      engagement: Number(cur.engagement),
      previous: prev
        ? {
            likes: Number(prev.likes),
            recasts: Number(prev.recasts),
            replies: Number(prev.replies),
            posts: Number(prev.posts),
            engagement: Number(prev.engagement),
          }
        : undefined,
      rankDeltas: prev
        ? {
            likes: prevLikes[cur.url] - curLikes[cur.url],
            recasts: prevRecasts[cur.url] - curRecasts[cur.url],
            replies: prevReplies[cur.url] - curReplies[cur.url],
            posts: prevPosts[cur.url] - curPosts[cur.url],
            engagement: prevEngagement[cur.url] - curEngagement[cur.url],
          }
        : undefined,
    } as LinkStats;
  });

  return NextResponse.json(response);
}
