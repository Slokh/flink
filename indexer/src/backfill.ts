import { FARCASTER_EPOCH, Message } from "@farcaster/hub-nodejs";
import { FarcasterLink, upsertFarcaster } from "../db/farcaster";
import {
  extractKeywordsFromCasts,
  messagesToCastDatas,
} from "../farcaster/casts";
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
import { handleUserUpdate } from "../farcaster/users";

const START_TIMESTAMP = 1701789856;
const END_TIMESTAMP = 17017898560;

const backfill = async () => {
  const client = await getHubClient();
  let currentFid = 211000;
  for (let fid = currentFid; fid >= 1; fid--) {
    console.log(`[backfill] [${fid}]`);
    // await handleUserUpdate(client, fid);

    const farcasterUser = await client.getFarcasterUser(fid);
    if (!farcasterUser) {
      return;
    }
    await upsertFarcaster(farcasterUser);

    await Promise.all([
      await handleFidCasts(client, fid),
      await handleReactions(client, fid),
      await handleLinks(client, fid),
    ]);

    // await prisma.backfill.create({
    //   data: { fid },
    // });
  }
};

export const handleFidCasts = async (client: Client, fid: number) => {
  let pageToken: Uint8Array | undefined = undefined;
  do {
    const response = await client.client.getCastsByFid({
      fid,
      pageToken,
    });
    if (response.isOk()) {
      const messages = response.value.messages.filter(isValidTimestamp);
      console.log(`[backfill-casts] [${fid}] found ${messages.length} casts`);
      // await handleCastMessages(client, messages, true, true);
      const casts = messagesToCastDatas(messages);
      await extractKeywordsFromCasts(casts);
      pageToken = response.value.nextPageToken;
    } else {
      throw new Error(
        `backfill failed to get casts for fid ${fid} - ${response.error}]`
      );
    }
  } while (pageToken?.length);
};

export const handleReactions = async (client: Client, fid: number) => {
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

export const handleLinks = async (client: Client, fid: number) => {
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

const main = async () => {
  while (true) {
    try {
      await backfill();
      break;
    } catch (e) {
      console.error("An error occurred, retrying...", e);
    }
  }
};

main();
