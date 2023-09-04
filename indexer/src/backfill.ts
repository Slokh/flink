import {
  CastData,
  bulkUpsertCasts,
  bulkUpsertReactions,
  resetFid,
} from "../db/cast";
import { generateCastData } from "../farcaster/casts";
import { Client, getHubClient } from "../farcaster/hub";
import { handleFidUserUpdate } from "../farcaster/users";
import prisma from "../lib/prisma";

const backfill = async () => {
  const client = await getHubClient();
  let currentFid = await getCurrentFid();
  for (let fid = currentFid + 1; ; fid++) {
    await resetFid(fid);
    await handleFidUserUpdate("backfill", client, fid);
    await handleFidCasts(client, fid);
    await prisma.backfill.create({ data: { fid } });
  }
};

const handleFidCasts = async (client: Client, fid: number) => {
  let pageToken: Uint8Array | undefined = undefined;
  do {
    const response = await client.client.getCastsByFid({
      fid,
      pageToken,
    });
    if (response.isOk()) {
      const messages = response.value.messages;
      console.log(
        `[backfill] [casts] [${fid}] processing ${messages.length} casts`
      );

      const castData = messages
        .map((message) => generateCastData(message))
        .filter(Boolean) as CastData[];
      await bulkUpsertCasts(castData);

      const reactions = await Promise.all(
        castData.map((cast) => client.getCastReactions(cast.fid, cast.rawHash))
      );
      await bulkUpsertReactions(reactions.flat());

      pageToken = response.value.nextPageToken;
    } else {
      throw new Error(
        `[backfill] failed to get casts for fid ${fid} - ${response.error}]`
      );
    }
  } while (pageToken?.length);
};

const getCurrentFid = async () => {
  const lastFidRecord = await prisma.backfill.findFirst({
    orderBy: { fid: "desc" },
    select: { fid: true },
  });

  return lastFidRecord?.fid ? lastFidRecord.fid + 1 : 1;
};

backfill();
