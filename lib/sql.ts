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
            "targetFid" AS fid,
            "targetHash" AS "hash",
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
          AND NOT "FarcasterCastReaction"."deleted"
          AND NOT "FarcasterCast"."deleted"
        GROUP BY "targetFid", "targetHash"
    ),
    ReplyCounts AS (
      SELECT
        "topParentFid" AS fid,
        "topParentCast" AS "hash",
        COUNT(*) AS replies,
        COUNT(DISTINCT "fid"),
        EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCast"."timestamp"))) AS age_in_seconds
      FROM "public"."FarcasterCast"
      WHERE "FarcasterCast"."timestamp" >= NOW() - '7 days'::interval
          AND NOT "FarcasterCast"."deleted"
      GROUP BY "topParentFid", "topParentCast"
    )    

    SELECT
        r.fid,
        r.hash,
        LOG(GREATEST(ABS(r.weighted_votes), 1)) + LOG(GREATEST(ABS(c.replies * 0.5), 1)) - 
        ((r.age_in_seconds + c.age_in_seconds) / 86400) AS hotness
    FROM ReactionCounts r
      JOIN ReplyCounts c ON r.fid = c.fid AND r.hash = c.hash
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;
  } else {
    return prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "targetFid" AS fid,
            "targetHash" AS "hash",
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
          AND NOT "FarcasterCastReaction"."deleted"
          AND NOT "FarcasterCast"."deleted"
        GROUP BY "targetFid", "targetHash"
    ),
    ReplyCounts AS (
      SELECT
        "topParentFid" AS fid,
        "topParentCast" AS "hash",
        COUNT(*) AS replies,
        COUNT(DISTINCT "fid"),
        EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCast"."timestamp"))) AS age_in_seconds
      FROM "public"."FarcasterCast"
      WHERE "FarcasterCast"."timestamp" >= NOW() - '7 days'::interval
          AND NOT "FarcasterCast"."deleted"
      GROUP BY "topParentFid", "topParentCast"
    )    

    SELECT
        r.fid,
        r.hash,
        LOG(GREATEST(ABS(r.weighted_votes), 1)) + LOG(GREATEST(ABS(c.replies * 0.5), 1)) - 
        ((r.age_in_seconds + c.age_in_seconds) / 86400) AS hotness
    FROM ReactionCounts r
      JOIN ReplyCounts c ON r.fid = c.fid AND r.hash = c.hash
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
            "targetFid" AS fid,
            "targetHash" AS "hash",
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
        WHERE "FarcasterCastReaction"."timestamp" >= NOW() - '2 days'::interval
          AND "FarcasterCast"."parentCast" IS NULL
          AND NOT "FarcasterCastReaction"."deleted"
          AND NOT "FarcasterCast"."deleted"
        GROUP BY "targetFid", "targetHash"
    ),
    ReplyCounts AS (
      SELECT
        "topParentFid" AS fid,
        "topParentCast" AS "hash",
        COUNT(*) AS replies,
        COUNT(DISTINCT "fid"),
        EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCast"."timestamp"))) AS age_in_seconds
      FROM "public"."FarcasterCast"
      WHERE "FarcasterCast"."timestamp" >= NOW() - '2 days'::interval
          AND NOT "FarcasterCast"."deleted"
      GROUP BY "topParentFid", "topParentCast"
    )    

    SELECT
        r.fid,
        r.hash,
        LOG(GREATEST(ABS(r.weighted_votes), 1)) + LOG(GREATEST(ABS(c.replies * 0.5), 1)) - 
        ((r.age_in_seconds + c.age_in_seconds) / 86400) AS hotness
    FROM ReactionCounts r
      JOIN ReplyCounts c ON r.fid = c.fid AND r.hash = c.hash
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;
  } else {
    return prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "targetFid" AS fid,
            "targetHash" AS "hash",
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
        WHERE "FarcasterCastReaction"."timestamp" >= NOW() - '2 days'::interval
          AND NOT "FarcasterCastReaction"."deleted"
          AND NOT "FarcasterCast"."deleted"
        GROUP BY "targetFid", "targetHash"
    ),
    ReplyCounts AS (
      SELECT
        "topParentFid" AS fid,
        "topParentCast" AS "hash",
        COUNT(*) AS replies,
        COUNT(DISTINCT "fid"),
        EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCast"."timestamp"))) AS age_in_seconds
      FROM "public"."FarcasterCast"
      WHERE "FarcasterCast"."timestamp" >= NOW() - '2 days'::interval
          AND NOT "FarcasterCast"."deleted"
      GROUP BY "topParentFid", "topParentCast"
    )    

    SELECT
        r.fid,
        r.hash,
        LOG(GREATEST(ABS(r.weighted_votes), 1)) + LOG(GREATEST(ABS(c.replies * 0.5), 1)) - 
        ((r.age_in_seconds + c.age_in_seconds) / 86400) AS hotness
    FROM ReactionCounts r
      JOIN ReplyCounts c ON r.fid = c.fid AND r.hash = c.hash
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;
  }
};

export const HotCastsForFid = (
  viewerFid: number,
  page: number,
  onlyParents: boolean
): Promise<FidHash[]> => {
  if (onlyParents) {
    return prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "FarcasterCastReaction"."targetFid" AS fid,
            "FarcasterCastReaction"."targetHash" AS "hash",
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
          JOIN "public"."FarcasterLink" ON "FarcasterLink"."targetFid" = "FarcasterCast"."fid"
        WHERE "FarcasterLink"."fid" = ${viewerFid}
          AND "FarcasterCast"."parentCast" IS NULL
          AND NOT "FarcasterCastReaction"."deleted"
          AND NOT "FarcasterLink"."deleted"
        GROUP BY "FarcasterCastReaction"."targetFid", "FarcasterCastReaction"."targetHash"
    ),
    ReplyCounts AS (
      SELECT
        "topParentFid" AS fid,
        "topParentCast" AS "hash",
        COUNT(*) AS replies,
        COUNT(DISTINCT "FarcasterCast"."fid"),
        EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCast"."timestamp"))) AS age_in_seconds
      FROM "public"."FarcasterCast"
        LEFT JOIN "public"."FarcasterLink" ON "FarcasterLink"."targetFid" = "FarcasterCast"."topParentFid"
        WHERE "FarcasterLink"."fid" = ${viewerFid}
          AND NOT "FarcasterLink"."deleted"
      GROUP BY "topParentFid", "topParentCast"
    )    

    SELECT
        r.fid,
        r.hash,
        LOG(GREATEST(ABS(r.weighted_votes), 1)) + LOG(GREATEST(ABS(c.replies * 0.5), 1)) - 
        ((r.age_in_seconds + c.age_in_seconds) / 86400) AS hotness
    FROM ReactionCounts r
      JOIN ReplyCounts c ON r.fid = c.fid AND r.hash = c.hash
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;
  } else {
    return prisma.$queryRaw`
    WITH ReactionCounts AS (
        SELECT
            "FarcasterCastReaction"."targetFid" AS fid,
            "FarcasterCastReaction"."targetHash" AS "hash",
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
          JOIN "public"."FarcasterLink" ON "FarcasterLink"."targetFid" = "FarcasterCast"."fid"
        WHERE "FarcasterLink"."fid" = ${viewerFid}
          AND NOT "FarcasterCastReaction"."deleted"
          AND NOT "FarcasterLink"."deleted"
        GROUP BY "FarcasterCastReaction"."targetFid", "FarcasterCastReaction"."targetHash"
    ),
    ReplyCounts AS (
      SELECT
        "topParentFid" AS fid,
        "topParentCast" AS "hash",
        COUNT(*) AS replies,
        COUNT(DISTINCT "FarcasterCast"."fid"),
        EXTRACT(EPOCH FROM (NOW() - MIN("FarcasterCast"."timestamp"))) AS age_in_seconds
      FROM "public"."FarcasterCast"
        JOIN "public"."FarcasterLink" ON "FarcasterLink"."targetFid" = "FarcasterCast"."topParentFid"
        WHERE "FarcasterLink"."fid" = ${viewerFid}
          AND NOT "FarcasterLink"."deleted"
      GROUP BY "topParentFid", "topParentCast"
    )    

    SELECT
        r.fid,
        r.hash,
        LOG(GREATEST(ABS(r.weighted_votes), 1)) + LOG(GREATEST(ABS(c.replies * 0.5), 1)) - 
        ((r.age_in_seconds + c.age_in_seconds) / 86400) AS hotness
    FROM ReactionCounts r
      JOIN ReplyCounts c ON r.fid = c.fid AND r.hash = c.hash
    ORDER BY hotness DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};
  `;
  }
};
