import prisma from "@/lib/prisma";
import { FarcasterUser } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { fid: string } }
) {
  const { fid } = params;
  const user = await prisma.farcaster.findFirst({
    where: {
      fid: parseInt(fid),
    },
  });

  return NextResponse.json({
    fid: user?.fid,
    fname: user?.fname,
    pfp: user?.pfp,
    bio: user?.bio,
    display: user?.display,
  } as FarcasterUser);
}
