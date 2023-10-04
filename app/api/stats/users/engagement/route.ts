import prisma from "@/lib/prisma";
import { UserStats } from "@/lib/types";
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
      return a.fid - b.fid;
    })
    .reduce((map: any, obj: any, index: number) => {
      map[obj.fid] = index + 1;
      return map;
    }, {});
}

export async function GET(
  request: Request
): Promise<NextResponse<UserStats[]>> {
  const url = new URL(request.url);
  const time = url.searchParams.get("time") || "year";

  const curHours = timeToHours[time];
  const prevHours = timeToHours[time] * 2;

  const [curData, prevData]: any = await Promise.all([
    prisma.$queryRaw`
        SELECT
            fid,
            sum(likes) as likes,
            sum(recasts) as recasts,
            sum(replies) as replies,
            sum(posts) as posts,
            sum(liked) as liked,
            sum(recasted) as recasted,
            sum(mentions) as mentions,
            sum(1 * posts + 0.5 * replies + 0.25 * liked + 0.25 * recasted) as engagement
        FROM "public"."FarcasterUserStats"
        WHERE timestamp > NOW() - ${`${curHours} hour`}::INTERVAL
        GROUP BY fid
        ORDER BY engagement DESC
    `,
    prisma.$queryRaw`
    SELECT
        fid,
        sum(likes) as likes,
        sum(recasts) as recasts,
        sum(replies) as replies,
        sum(posts) as posts,
        sum(liked) as liked,
        sum(recasted) as recasted,
        sum(mentions) as mentions,
        sum(1 * posts + 0.5 * replies + 0.25 * liked + 0.25 * recasted) as engagement
    FROM "public"."FarcasterUserStats"
        WHERE timestamp > NOW() - ${`${prevHours} hour`}::INTERVAL
            AND timestamp < NOW() - ${`${curHours} hour`}::INTERVAL
        GROUP BY fid
        ORDER BY engagement DESC
    `,
  ]);

  const curMentions = getRank(curData, "mentions");
  const prevMentions = getRank(prevData, "mentions");
  const curLiked = getRank(curData, "liked");
  const prevLiked = getRank(prevData, "liked");
  const curRecasted = getRank(curData, "recasted");
  const prevRecasted = getRank(prevData, "recasted");
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

  const slicedData = curData.slice(0, 100);

  const users = await prisma.farcaster.findMany({
    where: { fid: { in: slicedData.map((cur: any) => cur.fid) } },
  });

  const userMap = users.reduce((map: any, obj: any) => {
    map[obj.fid] = obj;
    return map;
  }, {});

  const response = slicedData.map((cur: any, i: number) => {
    const prev = prevData.find((p: any) => p.url === cur.url);
    return {
      user: userMap[cur.fid],
      mentions: Number(cur.mentions),
      liked: Number(cur.liked),
      recasted: Number(cur.recasted),
      likes: Number(cur.likes),
      recasts: Number(cur.recasts),
      replies: Number(cur.replies),
      posts: Number(cur.posts),
      engagement: Number(cur.engagement),
      previous: prev
        ? {
            mentions: Number(prev.mentions),
            liked: Number(prev.liked),
            recasted: Number(prev.recasted),
            likes: Number(prev.likes),
            recasts: Number(prev.recasts),
            replies: Number(prev.replies),
            posts: Number(prev.posts),
            engagement: Number(prev.engagement),
          }
        : undefined,
      rankDeltas: prev
        ? {
            mentions: prevMentions[cur.fid] - curMentions[cur.fid],
            liked: prevLiked[cur.fid] - curLiked[cur.fid],
            recasted: prevRecasted[cur.fid] - curRecasted[cur.fid],
            likes: prevLikes[cur.fid] - curLikes[cur.fid],
            recasts: prevRecasts[cur.fid] - curRecasts[cur.fid],
            replies: prevReplies[cur.fid] - curReplies[cur.fid],
            posts: prevPosts[cur.fid] - curPosts[cur.fid],
            engagement: prevEngagement[cur.fid] - curEngagement[cur.fid],
          }
        : {
            mentions: Object.keys(curMentions).length - curMentions[cur.fid],
            liked: Object.keys(curLiked).length - curLiked[cur.fid],
            recasted: Object.keys(curRecasted).length - curRecasted[cur.fid],
            likes: Object.keys(curLikes).length - curLikes[cur.fid],
            recasts: Object.keys(curRecasts).length - curRecasts[cur.fid],
            replies: Object.keys(curReplies).length - curReplies[cur.fid],
            posts: Object.keys(curPosts).length - curPosts[cur.fid],
            engagement:
              Object.keys(curEngagement).length - curEngagement[cur.fid],
          },
    } as UserStats;
  });

  return NextResponse.json(response);
}
