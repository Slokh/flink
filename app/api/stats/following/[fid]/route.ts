import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { fid: number } }
): Promise<NextResponse> {
  const fid = parseInt(params.fid as any);

  const followingList = await prisma.farcasterLink.findMany({
    where: {
      fid,
      linkType: "follow",
      deleted: false,
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  const fids = followingList.map((f) => f.targetFid);
  const [users, followers, following] = await Promise.all([
    prisma.farcaster.findMany({
      where: {
        fid: {
          in: fids,
        },
      },
    }),
    prisma.farcasterLink.groupBy({
      by: ["targetFid"],
      where: {
        linkType: "follow",
        targetFid: {
          in: fids,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.farcasterLink.groupBy({
      by: ["fid"],
      where: {
        linkType: "follow",
        fid: {
          in: fids,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const followingMap = following.reduce((acc, following) => {
    acc[following.fid] = following._count._all;
    return acc;
  }, {} as Record<number, number>);
  const followersMap = followers.reduce((acc, follower) => {
    acc[follower.targetFid] = follower._count._all;
    return acc;
  }, {} as Record<number, number>);
  const userMap = users.reduce((map: any, obj: any) => {
    map[obj.fid] = {
      ...obj,
      following: followingMap[obj.fid] || 0,
      followers: followersMap[obj.fid] || 0,
    };
    return map;
  }, {});

  return NextResponse.json({
    following: followingList.map((f) => ({
      ...f,
      user: userMap[f.targetFid],
    })),
  });
}
