import { getTimeInterval } from "@/lib/casts";
import { CHANNELS_BY_ID } from "@/lib/channels";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { channel: string } }
): Promise<NextResponse> {
  const channel =
    CHANNELS_BY_ID[params.channel]?.parentUrl ||
    decodeURIComponent(params.channel);

  const url = new URL(request.url);
  const time = url.searchParams.get("time") || "all";

  const stats = await getChannelStats(channel);
  const users = await getChannelUsers(channel, time);

  return NextResponse.json({
    stats,
    users,
  });
}

const getChannelStats = async (channel: string) => {
  const data: any[] = await prisma.$queryRaw`
    SELECT 
      date_trunc('day', timestamp) as day,
      sum(posts) as posts,
      sum(replies) as replies,
      sum(likes) as likes,
      sum(recasts) as recasts,
      sum(1 * posts + 0.5 * replies + 0.25 * likes + 0.25 * recasts) as engagement
    FROM "public"."FarcasterChannelStats"
    WHERE url = ${channel}
    GROUP BY day
  `;

  return data
    .map((d) => ({
      timestamp: d.day.getTime(),
      posts: Number(d.posts),
      replies: Number(d.replies),
      likes: Number(d.likes),
      recasts: Number(d.recasts),
      engagement: Number(d.engagement),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

const getChannelUsers = async (channel: string, time: string) => {
  const timeInterval = getTimeInterval(time as any);
  const data: any[] = await prisma.$queryRaw`
    SELECT 
      fid,
      sum(posts) as posts,
      sum(replies) as replies,
      sum(likes) as likes,
      sum(recasts) as recasts,
      sum(liked) as liked,
      sum(recasted) as recasted,
      sum(mentions) as mentions,
      sum(1 * posts + 0.5 * replies + 0.25 * liked + 0.25 * recasted) as engagement
    FROM "public"."FarcasterUserStats"
    WHERE url = ${channel}
      AND "timestamp" >= NOW() -  ${timeInterval}::interval
    GROUP BY fid
    ORDER BY engagement DESC
    LIMIT 100
  `;

  const fids = data.map((d) => d.fid);
  const users = await prisma.farcaster.findMany({
    where: { fid: { in: fids } },
  });
  const userMap = users.reduce((acc, user) => {
    acc[user.fid] = user;
    return acc;
  }, {} as Record<string, any>);

  return data.map((d) => ({
    user: userMap[d.fid],
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
