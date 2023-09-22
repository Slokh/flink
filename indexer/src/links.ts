import { HubEventType, Message, MessageType } from "@farcaster/hub-nodejs";
import { Client, convertToHex, getHubClient } from "../farcaster/hub";
import { handleUserUpdate } from "../farcaster/users";
import { handleCastMessages } from "../farcaster/casts";
import prisma from "../lib/prisma";
import { deleteCast } from "../db/cast";
import { generateReactionData } from "../farcaster/reactions";
import {
  CastReaction,
  UrlReaction,
  deleteCastReaction,
  deleteUrlReaction,
  upsertCastReactions,
  upsertUrlReactions,
} from "../db/reaction";
import { deleteFarcasterLink, upsertFarcasterLinks } from "../db/farcaster";
import { generateLinkData } from "../farcaster/link";

const run = async () => {
  const client = await getHubClient();
  const subscribtion = await client.subscribe({
    eventTypes: [HubEventType.MERGE_MESSAGE],
  });
  if (!subscribtion.isOk()) {
    console.error("Failed to subscribe to hub events");
    process.exit(1);
  }

  for await (const event of subscribtion.value) {
    const message: Message = event.mergeMessageBody.message;
    const fid = message.data?.fid;
    const messageType = message.data?.type;
    if (!fid || !messageType) {
      continue;
    }

    if (
      messageType === MessageType.VERIFICATION_ADD_ETH_ADDRESS ||
      messageType === MessageType.USER_DATA_ADD
    ) {
      await handleUserUpdate(client, fid);
      continue;
    }

    // check if fid exists yet
    const farcasterUser = await prisma.farcaster.findFirst({ where: { fid } });
    if (!farcasterUser) {
      await handleUserUpdate(client, fid);
    }

    if (messageType === MessageType.LINK_ADD) {
      await handleLinkAdd(message);
    } else if (messageType === MessageType.LINK_REMOVE) {
      await handleLinkRemove(message);
    }
  }
};

const handleLinkAdd = async (message: Message) => {
  const linkData = generateLinkData(message);
  if (!linkData) return;
  await upsertFarcasterLinks([linkData]);
  console.log(
    `[link-add] [${linkData.fid}] added link ${linkData.linkType} to ${linkData.targetFid}`
  );
};

const handleLinkRemove = async (message: Message) => {
  const linkData = generateLinkData(message);
  if (!linkData) return;
  await deleteFarcasterLink(linkData);
  console.log(
    `[link-add] [${linkData.fid}] removed link ${linkData.linkType} to ${linkData.targetFid}`
  );
};

run();
