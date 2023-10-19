import { getCastsByFidHashes, getCastsResponse } from "@/lib/casts";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const PAGE_SIZE = 25;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const viewer = url.searchParams.get("viewer") || undefined;

  const fidHashes: { fid: number; hash: string }[] = viewer
    ? await prisma.$queryRaw`
        SELECT DISTINCT "FarcasterCastEmbedUrl".fid, hash, "FarcasterCastEmbedUrl".timestamp
        FROM "public"."FarcasterCastEmbedUrl"
            JOIN "public"."FarcasterLink" ON "FarcasterLink"."targetFid" = "FarcasterCastEmbedUrl"."fid"
        WHERE "transactionMetadata" IS NOT NULL
        AND NOT "FarcasterCastEmbedUrl".deleted
        AND "FarcasterLink"."fid" = ${parseInt(viewer)}
        ORDER BY "FarcasterCastEmbedUrl".timestamp DESC
        LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
    `
    : await prisma.$queryRaw`
        SELECT DISTINCT fid, hash, timestamp
        FROM "public"."FarcasterCastEmbedUrl"
        WHERE "transactionMetadata" IS NOT NULL
        AND NOT deleted
        ORDER BY timestamp DESC
        LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
    `;

  const casts = await getCastsByFidHashes(fidHashes);
  const mints = await getCastsResponse(
    casts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  );

  return NextResponse.json({ mints });
}
