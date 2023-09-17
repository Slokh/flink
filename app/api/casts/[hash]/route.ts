import { getCast } from "@/lib/casts";
import { FarcasterCast, FarcasterCastTree } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { hash: string } }
) {
  const { hash } = params;
  const casts = await getCast(hash);
  if (!casts) {
    return NextResponse.json({}, { status: 404 });
  }
  const tree = buildTree(casts, hash);
  if (!tree) {
    return NextResponse.json({}, { status: 404 });
  }
  return NextResponse.json(tree);
}

function buildTree(
  casts: FarcasterCast[],
  parentHash: string
): FarcasterCastTree | undefined {
  const current = casts.find((cast) => cast.hash === parentHash);
  if (!current) return;

  const children = casts
    .filter((cast) => cast.parentCast?.hash === parentHash)
    .map((child) => buildTree(casts, child.hash))
    .filter(Boolean) as FarcasterCastTree[];

  return {
    ...current,
    children: children.sort((a, b) => b.likes - a.likes),
  };
}
