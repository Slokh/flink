import { getCastsResponseByTopLikes } from "@/lib/casts";
import { FarcasterCast } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request
): Promise<NextResponse<FarcasterCast[]>> {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  return await getCastsResponseByTopLikes(page);
}
