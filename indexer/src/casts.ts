import { HubEventType, Message, MessageType } from "@farcaster/hub-nodejs";
import { Client, convertToHex, getHubClient } from "../farcaster/hub";
import { handleCastMessages } from "../farcaster/casts";
import { deleteCast } from "../db/cast";

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

    if (messageType === MessageType.CAST_ADD) {
      await handleCastAdd(client, message);
    } else if (messageType === MessageType.CAST_REMOVE) {
      await handleCastRemove(message);
    }
  }
};

const handleCastAdd = async (client: Client, message: Message) => {
  const castData = await handleCastMessages(client, [message], false);
  for (const data of castData) {
    console.log(`[cast-add] [${data.fid}] added cast ${data.hash}`);
  }
};

const handleCastRemove = async (message: Message) => {
  if (!message.data?.castRemoveBody) return;
  const fid = message.data.fid;
  const hash = convertToHex(message.data.castRemoveBody.targetHash);
  await deleteCast(fid, hash);
  console.log(`[cast-remove] [${fid}] deleted cast ${hash}`);
};

run();
