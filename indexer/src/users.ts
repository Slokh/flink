import { HubEventType, Message, MessageType } from "@farcaster/hub-nodejs";
import { getHubClient } from "../farcaster/hub";
import { handleUserUpdate } from "../farcaster/users";

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
    }
  }
};

run();
