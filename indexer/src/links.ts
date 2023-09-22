import { HubEventType, Message, MessageType } from "@farcaster/hub-nodejs";
import { getHubClient } from "../farcaster/hub";
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
