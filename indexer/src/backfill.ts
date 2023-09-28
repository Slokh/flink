import { FARCASTER_EPOCH, Message } from "@farcaster/hub-nodejs";
import { FarcasterLink } from "../db/farcaster";
import { handleCastMessages } from "../farcaster/casts";
import { Client, getHubClient } from "../farcaster/hub";
import { generateLinkData } from "../farcaster/link";
import prisma from "../lib/prisma";
import { generateReactionData } from "../farcaster/reactions";
import {
  CastReaction,
  UrlReaction,
  upsertCastReactions,
  upsertUrlReactions,
} from "../db/reaction";

const START_TIMESTAMP = 1695558936;
const END_TIMESTAMP = 1695580536;

const backfill = async () => {
  const client = await getHubClient();
  // let currentFid = await getCurrentFid();
  let currentFid = 1;
  for (let fid = currentFid; fid < 25000; fid++) {
    // await handleUserUpdate(client, fid);
    await handleFidCasts(client, fid);
    await handleReactions(client, fid);
    await handleLinks(client, fid);
    // await prisma.backfill.create({ data: { fid } });
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
      const messages = response.value.messages.filter(isValidTimestamp);
      console.log(`[backfill-links] [${fid}] found ${messages.length} casts`);
      await handleCastMessages(client, messages);
      pageToken = response.value.nextPageToken;
    } else {
      throw new Error(
        `backfill failed to get casts for fid ${fid} - ${response.error}]`
      );
    }
  } while (pageToken?.length);
};

const handleReactions = async (client: Client, fid: number) => {
  let pageToken: Uint8Array | undefined = undefined;
  do {
    const response = await client.client.getReactionsByFid({
      fid,
      pageToken,
    });
    if (response.isOk()) {
      const messages = response.value.messages.filter(isValidTimestamp);
      const reactions = messages.map(generateReactionData).filter(Boolean);

      console.log(
        `[backfill-reactions] [${fid}] found ${reactions.length} reactions`
      );

      if (reactions.length === 0) continue;

      const castReactions = reactions.filter(
        (reaction) => reaction?.targetHash
      ) as CastReaction[];

      const urlReactions = reactions.filter(
        (reaction) => reaction?.targetUrl
      ) as UrlReaction[];

      await Promise.all([
        upsertCastReactions(castReactions),
        upsertUrlReactions(urlReactions),
      ]);

      pageToken = response.value.nextPageToken;
    } else {
      throw new Error(
        `backfill failed to get reactions for fid ${fid} - ${response.error}]`
      );
    }
  } while (pageToken?.length);
};

const handleLinks = async (client: Client, fid: number) => {
  let pageToken: Uint8Array | undefined = undefined;
  do {
    const response = await client.client.getLinksByFid({
      fid,
      pageToken,
    });
    if (response.isOk()) {
      const messages = response.value.messages.filter(isValidTimestamp);
      const links = messages
        .map(generateLinkData)
        .filter(Boolean) as FarcasterLink[];

      console.log(`[backfill-links] [${fid}] found ${links.length} links`);

      if (links.length === 0) continue;

      await prisma.farcasterLink.createMany({
        data: links,
        skipDuplicates: true,
      });
      pageToken = response.value.nextPageToken;
    } else {
      throw new Error(
        `backfill failed to get links for fid ${fid} - ${response.error}]`
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

const isValidTimestamp = (message: Message) => {
  if (!message.data?.timestamp) return false;
  const timestamp = message.data.timestamp + FARCASTER_EPOCH / 1000;
  return timestamp >= START_TIMESTAMP && timestamp <= END_TIMESTAMP;
};

backfill();
