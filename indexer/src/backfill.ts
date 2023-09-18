import { FarcasterLink } from "../db/farcaster";
import {
  handleCastMessages,
  extractReactionsFromCasts,
  messagesToCastDatas,
} from "../farcaster/casts";
import { Client, getHubClient } from "../farcaster/hub";
import { generateLinkData } from "../farcaster/link";
import prisma from "../lib/prisma";

const backfill = async () => {
  const client = await getHubClient();
  let currentFid = 1;
  for (let fid = currentFid; fid < 25000; fid++) {
    await handleLinks(client, fid);
  }

  // let currentFid = await getCurrentFid();
  // for (let fid = currentFid; ; fid++) {
  //   await handleFidCasts(client, fid);
  //   await prisma.backfill.create({ data: { fid } });
  // }
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
      await handleCastMessages(client, messages);

      const castDatas = messagesToCastDatas(messages);
      await extractReactionsFromCasts(client, castDatas);

      pageToken = response.value.nextPageToken;
    } else {
      throw new Error(
        `backfill failed to get casts for fid ${fid} - ${response.error}]`
      );
    }
  } while (pageToken?.length);
};

const handleLinks = async (client: Client, fid: number) => {
  const links = await client.client.getLinksByFid({ fid });
  if (links.isOk()) {
    console.log(
      `[backfill] [${fid}] fetched ${links.value.messages.length} links`
    );
    await prisma.farcasterLink.createMany({
      data: links.value.messages
        .map(generateLinkData)
        .filter(Boolean) as FarcasterLink[],
      skipDuplicates: true,
    });
  } else {
    throw new Error(
      `backfill failed to get links for fid ${fid} - ${links.error}]`
    );
  }
};

const getCurrentFid = async () => {
  const lastFidRecord = await prisma.backfill.findFirst({
    orderBy: { fid: "desc" },
    select: { fid: true },
  });

  return lastFidRecord?.fid ? lastFidRecord.fid + 1 : 1;
};

backfill();
