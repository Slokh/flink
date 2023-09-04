import { handleFidUserUpdate } from "@/indexer/farcaster/users";
import { getIdentityForInput } from "@/lib/identity";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleEntity } from "../route";
import { getHubClient } from "@/indexer/farcaster/hub";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { entityId } = await getIdentityForInput(id, true);

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

  await handleFidUserUpdate("manual", await getHubClient(), farcaster.fid);

  return NextResponse.json(await handleEntity(entityId));
}
