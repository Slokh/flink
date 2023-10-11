import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [postFids, reactFids] = await Promise.all([
    prisma.farcasterCast.findMany({
      where: {
        timestamp: {
          gte: new Date(new Date().getTime() - 5 * 60 * 1000),
        },
      },
      select: {
        fid: true,
      },
      distinct: ["fid"],
    }),
    prisma.farcasterCastReaction.findMany({
      where: {
        timestamp: {
          gte: new Date(new Date().getTime() - 5 * 60 * 1000),
        },
      },
      select: {
        fid: true,
      },
      distinct: ["fid"],
    }),
  ]);

  const fids = Array.from(
    new Set([...postFids, ...reactFids].map((f) => f.fid))
  );

  return NextResponse.json({
    active: fids.length,
  });
}
