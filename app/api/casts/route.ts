import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const casts = await prisma.farcasterCast.findMany({
    orderBy: { timestamp: "desc" },
    take: 30,
  });

  const uniqueFids = casts.reduce((acc: number[], cast) => {
    if (!acc.includes(cast.fid)) {
      acc.push(cast.fid);
    }
    return acc;
  }, []);

  const farcasterUsers = await prisma.farcaster.findMany({
    where: { fid: { in: uniqueFids } },
  });

  const farcasterUsersMap = farcasterUsers.reduce(
    (acc: { [key: number]: any }, user) => {
      acc[user.fid] = user;
      return acc;
    },
    {}
  );

  return NextResponse.json(
    casts.map((cast) => ({
      ...cast,
      user: farcasterUsersMap[cast.fid],
    }))
  );
}
