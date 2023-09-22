import { HubEventType, Message, MessageType } from "@farcaster/hub-nodejs";
import { getHubClient } from "../farcaster/hub";
import { generateReactionData } from "../farcaster/reactions";
import {
  CastReaction,
  UrlReaction,
  deleteCastReaction,
  deleteUrlReaction,
  upsertCastReactions,
  upsertUrlReactions,
} from "../db/reaction";

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

    if (messageType === MessageType.REACTION_ADD) {
      await handleReactionAdd(message);
    } else if (messageType === MessageType.REACTION_REMOVE) {
      await handleReactionRemove(message);
    }
  }
};

const handleReactionAdd = async (message: Message) => {
  const reactionData = generateReactionData(message);
  if (!reactionData) return;

  if (reactionData?.targetUrl) {
    await upsertUrlReactions([reactionData as UrlReaction]);
    console.log(
      `[react-add] [${reactionData.fid}] reacted ${reactionData.reactionType} to url ${reactionData.targetUrl}}`
    );
    return;
  }

  if (!reactionData?.targetHash) return;

  await upsertCastReactions([reactionData as CastReaction]);
  console.log(
    `[react-add] [${reactionData.fid}] reacted ${reactionData.reactionType} to cast ${reactionData.targetHash}`
  );
};

const handleReactionRemove = async (message: Message) => {
  const reactionData = generateReactionData(message);
  if (!reactionData) return;

  if (reactionData?.targetUrl) {
    await deleteUrlReaction(reactionData as UrlReaction);
    console.log(
      `[react-remove] [${reactionData.fid}] unreacted ${reactionData.reactionType} from url ${reactionData.targetUrl}`
    );
    return;
  }

  if (!reactionData?.targetHash) return;

  await deleteCastReaction(reactionData as CastReaction);
  console.log(
    `[react-remove] [${reactionData.fid}] unreacted ${reactionData.reactionType} from cast ${reactionData.targetHash}`
  );
};

run();
