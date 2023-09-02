import { runForFid } from "@/indexer/farcaster";
import { getIdentityForInput } from "@/lib/identity";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleEntity } from "../route";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { entityId } = await getIdentityForInput(id);

  if (!entityId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const farcaster = await prisma.farcaster.findFirst({
    where: { entityId },
    select: { fid: true },
  });

  if (!farcaster?.fid) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await runForFid(farcaster.fid);

  return NextResponse.json(await handleEntity(entityId));
}
