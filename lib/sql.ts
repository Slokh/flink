import prisma from "@/lib/prisma";

const PAGE_SIZE = 25;

interface FidHash {
  fid: number;
  hash: string;
}

export const HotCastsForChannel = (
  parentUrl: string,
  page: number,
  onlyParents: boolean
): Promise<FidHash[]> => {
  if (onlyParents) {
    return prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "targetFid",
            "targetHash",
            SUM(
                CASE 
                    WHEN "reactionType" = 'like' THEN 1
                    WHEN "reactionType" = 'recast' THEN 0.5
                    ELSE 0
                END
            ) AS weighted_votes,
            EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCastReaction"."timestamp"))) AS age_in_seconds
        FROM "public"."FarcasterCastReaction"
          JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
        WHERE "FarcasterCast"."topParentUrl" = ${parentUrl}
          AND "FarcasterCast"."parentCast" IS NULL
        GROUP BY "targetFid", "targetHash"
    )

    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        LOG(GREATEST(ABS(weighted_votes), 1)) - 
        (age_in_seconds / 86400) AS hotness
    FROM ReactionCounts
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;
  } else {
    return prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "targetFid",
            "targetHash",
            SUM(
                CASE 
                    WHEN "reactionType" = 'like' THEN 1
                    WHEN "reactionType" = 'recast' THEN 0.5
                    ELSE 0
                END
            ) AS weighted_votes,
            EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCastReaction"."timestamp"))) AS age_in_seconds
        FROM "public"."FarcasterCastReaction"
          JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
        WHERE "FarcasterCast"."topParentUrl" = ${parentUrl}
        GROUP BY "targetFid", "targetHash"
    )

    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        LOG(GREATEST(ABS(weighted_votes), 1)) - 
        (age_in_seconds / 86400) AS hotness
    FROM ReactionCounts
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;
  }
};

export const HotCasts = (
  page: number,
  onlyParents: boolean
): Promise<FidHash[]> => {
  if (onlyParents) {
    return prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "targetFid",
            "targetHash",
            SUM(
                CASE 
                    WHEN "reactionType" = 'like' THEN 1
                    WHEN "reactionType" = 'recast' THEN 0.5
                    ELSE 0
                END
            ) AS weighted_votes,
            EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCastReaction"."timestamp"))) AS age_in_seconds
        FROM "public"."FarcasterCastReaction"
          JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
        WHERE "FarcasterCastReaction"."timestamp" >= NOW() - '7 days'::interval
          AND "FarcasterCast"."parentCast" IS NULL
        GROUP BY "targetFid", "targetHash"
    )

    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        LOG(GREATEST(ABS(weighted_votes), 1)) - 
        (age_in_seconds / 86400) AS hotness
    FROM ReactionCounts
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;
  } else {
    return prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "targetFid",
            "targetHash",
            SUM(
                CASE 
                    WHEN "reactionType" = 'like' THEN 1
                    WHEN "reactionType" = 'recast' THEN 0.5
                    ELSE 0
                END
            ) AS weighted_votes,
            EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCastReaction"."timestamp"))) AS age_in_seconds
        FROM "public"."FarcasterCastReaction"
          JOIN "public"."FarcasterCast" ON "FarcasterCast"."fid" = "FarcasterCastReaction"."targetFid" AND "FarcasterCast"."hash" = "FarcasterCastReaction"."targetHash"
        WHERE "FarcasterCastReaction"."timestamp" >= NOW() - '7 days'::interval
        GROUP BY "targetFid", "targetHash"
    )

    SELECT
        "targetFid" AS fid,
        "targetHash" AS hash,
        LOG(GREATEST(ABS(weighted_votes), 1)) - 
        (age_in_seconds / 86400) AS hotness
    FROM ReactionCounts
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;
  }
};
