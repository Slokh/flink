import prisma from "@/lib/prisma";
import { AuthenticatedUser } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { fid: string } }
) {
  const { fid } = params;
  const [user, likes, recasts, casts] = await Promise.all([
    prisma.farcaster.findFirst({
      where: {
        fid: parseInt(fid),
      },
    }),
    prisma.farcasterCastReaction.findMany({
      where: {
        fid: parseInt(fid),
        reactionType: "like",
        deleted: false,
      },
    }),
    prisma.farcasterCastReaction.findMany({
      where: {
        fid: parseInt(fid),
        reactionType: "recast",
        deleted: false,
      },
    }),
    prisma.farcasterCast.findMany({
      where: {
        fid: parseInt(fid),
        deleted: false,
      },
    }),
  ]);

  return NextResponse.json({
    fid: user?.fid,
    fname: user?.fname,
    pfp: user?.pfp,
    bio: user?.bio,
    display: user?.display,
    likes: likes.reduce((acc, cur) => {
      acc[cur.targetHash] = true;
      return acc;
    }, {} as Record<string, boolean>),
    recasts: recasts.reduce((acc, cur) => {
      acc[cur.targetHash] = true;
      return acc;
    }, {} as Record<string, boolean>),
    casts: casts.reduce((acc, cur) => {
      acc[cur.hash] = true;
      return acc;
    }, {} as Record<string, boolean>),
  } as AuthenticatedUser);
}
