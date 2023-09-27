import { getEmbedMetadata } from "@/indexer/embeds";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { url } = body;

  const metadata = await getEmbedMetadata(url);

  return NextResponse.json({
    url,
    ...metadata,
  });
}
