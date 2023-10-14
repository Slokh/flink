import { getCastsResponse } from "@/lib/casts";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { hash: string } }
) {
  const baseCast = await prisma.farcasterCast.findFirst({
    where: { hash: params.hash },
    include: {
      mentions: true,
    },
  });
  const casts = await getCastsResponse([baseCast]);
  return NextResponse.json({ cast: casts[0] });
}
