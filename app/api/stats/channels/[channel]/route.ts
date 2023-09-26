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
  const data: any[] = await prisma.$queryRaw`
    SELECT 
      date_trunc('day', timestamp) as day,
      sum(posts) as posts,
      sum(replies) as replies,
      sum(likes) as likes,
      sum(recasts) as recasts,
      sum(1 * posts + 0.5 * replies + 0.1 * likes + 0.25 * recasts) as engagement
    FROM "public"."FarcasterChannelStats"
    WHERE url = ${channel}
    GROUP BY day
  `;

  return NextResponse.json({
    data: data
      .map((d) => ({
        timestamp: d.day.getTime(),
        posts: Number(d.posts),
        replies: Number(d.replies),
        likes: Number(d.likes),
        recasts: Number(d.recasts),
        engagement: Number(d.engagement),
      }))
      .sort((a, b) => a.timestamp - b.timestamp),
  });
}
