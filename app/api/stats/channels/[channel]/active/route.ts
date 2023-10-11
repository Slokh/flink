import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { channel: string } }
) {
  const channel = decodeURIComponent(params.channel);
  const [postFids, reactFids] = await Promise.all([
    prisma.farcasterCast.findMany({
      where: {
        timestamp: {
          gte: new Date(new Date().getTime() - 5 * 60 * 1000),
        },
        topParentUrl: channel,
      },
      select: {
        fid: true,
      },
      distinct: ["fid"],
    }),
    await prisma.$queryRaw`
      SELECT DISTINCT "FarcasterCastReaction".fid
      FROM "public"."FarcasterCastReaction"
        JOIN "public"."FarcasterCast" ON "FarcasterCast".fid = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
      WHERE "FarcasterCast"."topParentUrl" = ${channel}
        AND "FarcasterCastReaction"."timestamp" > NOW() - INTERVAL '5 minutes'
    `,
  ]);

  const fids = Array.from(
    // @ts-ignore
    new Set([...postFids, ...reactFids].map((f) => f.fid))
  );

  return NextResponse.json({
    active: fids.length,
  });
}
