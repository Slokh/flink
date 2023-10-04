import { CHANNELS_BY_URL } from "@/lib/channels";
import prisma from "@/lib/prisma";
import { ChannelStats } from "@/lib/types";
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
      const aName = CHANNELS_BY_URL[a.url]?.name || "";
      const bName = CHANNELS_BY_URL[b.url]?.name || "";
      return aName.localeCompare(bName);
    })
    .reduce((map: any, obj: any, index: number) => {
      map[obj.url] = index + 1;
      return map;
    }, {});
}

export async function GET(
  request: Request
): Promise<NextResponse<ChannelStats[]>> {
  const url = new URL(request.url);
  const time = url.searchParams.get("time") || "year";

  const curHours = timeToHours[time];
  const prevHours = timeToHours[time] * 2;

  const [curData, prevData]: any = await Promise.all([
    prisma.$queryRaw`
        SELECT
            url,
            sum(likes) as likes,
            sum(recasts) as recasts,
            sum(replies) as replies,
            sum(posts) as posts,
            sum(1 * posts + 0.5 * replies + 0.25 * likes + 0.25 * recasts) as engagement
        FROM "public"."FarcasterChannelStats"
        WHERE timestamp > NOW() - ${`${curHours} hour`}::INTERVAL
            AND url <> 'uncategorized'
        GROUP BY url
        ORDER BY engagement DESC
    `,
    prisma.$queryRaw`
        SELECT
            url,
            sum(likes) as likes,
            sum(recasts) as recasts,
            sum(replies) as replies,
            sum(posts) as posts,
            sum(1 * posts + 0.5 * replies + 0.25 * likes + 0.25 * recasts) as engagement
        FROM "public"."FarcasterChannelStats"
        WHERE timestamp > NOW() - ${`${prevHours} hour`}::INTERVAL
            AND timestamp < NOW() - ${`${curHours} hour`}::INTERVAL
            AND url <> 'uncategorized'
        GROUP BY url
        ORDER BY engagement DESC
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

  const response = curData.map((cur: any, i: number) => {
    const prev = prevData.find((p: any) => p.url === cur.url);
    return {
      url: cur.url,
      channel: CHANNELS_BY_URL[cur.url] || {
        name: cur.url,
        parentUrl: cur.url,
        channelId: cur.url,
        image: "",
      },
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
        : {
            likes: Object.keys(curLikes).length - curLikes[cur.url],
            recasts: Object.keys(curRecasts).length - curRecasts[cur.url],
            replies: Object.keys(curReplies).length - curReplies[cur.url],
            posts: Object.keys(curPosts).length - curPosts[cur.url],
            engagement:
              Object.keys(curEngagement).length - curEngagement[cur.url],
          },
    } as ChannelStats;
  });

  return NextResponse.json(response);
}
