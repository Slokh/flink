import { handleCastMessages } from "../farcaster/casts";
import { Client, getHubClient } from "../farcaster/hub";
import prisma from "../lib/prisma";

const backfill = async () => {
  const client = await getHubClient();
  let currentFid = await getCurrentFid();
  for (let fid = currentFid; ; fid++) {
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

      await handleCastMessages(client, messages, true);

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
