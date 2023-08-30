import { HubEventType } from "@farcaster/hub-nodejs";
import { getHubClient, Client } from "../lib/hub";
import { handleFarcasterUser } from "./user";

const run = async () => {
  const client = await getHubClient();

  await runBackfill(client);
  await runLive(client);
};

const runBackfill = async (client: Client) => {
  for (let fid = 297; ; fid++) {
    const farcasterUser = await client.getFarcasterUser(fid);
    await handleFarcasterUser(farcasterUser);
  }
};

const runLive = async (client: Client) => {
  const subscribtion = await client.subscribe({
    eventTypes: [HubEventType.MERGE_MESSAGE],
  });
  if (!subscribtion.isOk()) {
    console.error("Failed to subscribe to hub events");
    process.exit(1);
  }

  for await (const event of subscribtion.value) {
    const message =
      event.mergeMessageBody.message.data?.verificationAddEthAddressBody;
    if (!message) continue;
    const farcasterUser = await client.getFarcasterUser(
      event.mergeMessageBody.message.fid
    );
    await handleFarcasterUser(farcasterUser);
  }
};

run();
