import { getEmbedMetadata } from "@/indexer/embeds";
import { getCastsResponseByFid } from "@/lib/casts";
import { FarcasterCast } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request
): Promise<NextResponse<FarcasterCast[]>> {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const fid = url.searchParams.get("fid");

  return await getCastsResponseByFid(
    page,
    fid ? parseInt(fid) : undefined,
    false
  );
}
