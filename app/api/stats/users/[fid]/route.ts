import { getTimeInterval } from "@/lib/casts";
import { CHANNELS_BY_URL } from "@/lib/channels";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { fid: number } }
): Promise<NextResponse> {
  const url = new URL(request.url);
  const time = url.searchParams.get("time") || "all";

  const fid = parseInt(params.fid as any);

  const stats = await getUserStats(fid);
  const users = await getUserChannels(fid, time);

  return NextResponse.json({
    stats,
    users,
  });
}

const getUserStats = async (fid: number) => {
  const data: any[] = await prisma.$queryRaw`
    SELECT 
      date_trunc('day', timestamp) as day,
      sum(posts) as posts,
      sum(replies) as replies,
      sum(likes) as likes,
      sum(recasts) as recasts,
      sum(liked) as liked,
      sum(recasted) as recasted,
      sum(mentions) as mentions,
      sum(1 * posts + 0.5 * replies + 0.1 * likes + 0.25 * recasts) as engagement
    FROM "public"."FarcasterUserStats"
    WHERE fid = ${fid}
    GROUP BY day
  `;

  return data
    .map((d) => ({
      timestamp: d.day.getTime(),
      posts: Number(d.posts),
      replies: Number(d.replies),
      likes: Number(d.likes),
      recasts: Number(d.recasts),
      liked: Number(d.liked),
      recasted: Number(d.recasted),
      mentions: Number(d.mentions),
      engagement: Number(d.engagement),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

const getUserChannels = async (fid: number, time: string) => {
  const timeInterval = getTimeInterval(time as any);
  const data: any[] = await prisma.$queryRaw`
    SELECT 
      url,
      sum(posts) as posts,
      sum(replies) as replies,
      sum(likes) as likes,
      sum(recasts) as recasts,
      sum(liked) as liked,
      sum(recasted) as recasted,
      sum(mentions) as mentions,
      sum(1 * posts + 0.5 * replies + 0.1 * likes + 0.25 * recasts) as engagement
    FROM "public"."FarcasterUserStats"
    WHERE fid = ${fid}
      AND "timestamp" >= NOW() -  ${timeInterval}::interval
    GROUP BY url
    ORDER BY engagement DESC
  `;

  return data.map((d) => ({
    channel: CHANNELS_BY_URL[d.url] || {
      name: d.url,
      parentUrl: d.url,
      channelId: d.url,
    },
    posts: Number(d.posts),
    replies: Number(d.replies),
    likes: Number(d.likes),
    recasts: Number(d.recasts),
    liked: Number(d.liked),
    recasted: Number(d.recasted),
    mentions: Number(d.mentions),
    engagement: Number(d.engagement),
  }));
};
