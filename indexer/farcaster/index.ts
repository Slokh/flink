import { HubEventType } from "@farcaster/hub-nodejs";
import { getHubClient, Client } from "./hub";
import { getLastFid, upsertFarcaster } from "../db/farcaster";
import { upsertEthereum } from "../db/ethereum";
import { getTwitterFromAddress, getTwitterFromRaw } from "../twitter";

export const indexFarcaster = async () => {
  const client = await getHubClient();
  const mode = process.env.MODE;

  if (mode === "backfill") {
    await backfill(client);
  } else if (mode === "live") {
    await live(client);
  } else {
    console.error("Invalid mode");
    process.exit(1);
  }
};

const backfill = async (client: Client) => {
  const lastFid = await getLastFid();
  for (let fid = lastFid; ; fid++) {
    if (!(await handleFidChange("backfill", client, fid))) {
      break;
    }
  }

  console.log("[backfill] complete");
};

const live = async (client: Client) => {
  const subscribtion = await client.subscribe({
    eventTypes: [HubEventType.MERGE_MESSAGE],
  });
  if (!subscribtion.isOk()) {
    console.error("Failed to subscribe to hub events");
    process.exit(1);
  }

  for await (const event of subscribtion.value) {
    const verificationData =
      event.mergeMessageBody.message.data?.verificationAddEthAddressBody;
    const userData = event.mergeMessageBody.message.data?.userDataBody;

    if (verificationData || userData) {
      await handleFidChange(
        "live",
        client,
        event.mergeMessageBody.message.data.fid
      );
    }
  }
};

const handleFidChange = async (
  mode: "backfill" | "live",
  client: Client,
  fid: number
) => {
  const farcasterUser = await client.getFarcasterUser(fid);
  if (!farcasterUser) {
    return;
  }

  const entityId = await upsertFarcaster(farcasterUser);

  console.log(
    `[${mode}] [${entityId}] processing fid ${fid} ${farcasterUser.fname}`
  );

  const addresses = await client.getVerifiedAddresses(fid);
  for (const address of addresses) {
    await upsertEthereum(address, entityId);

    console.log(`[${mode}] [${entityId}] added address ${address.address}`);

    const twitter = await getTwitterFromAddress(address.address, entityId);

    if (!twitter) continue;

    console.log(
      `[${mode}] [${entityId}] added twitter ${twitter.username} from ${twitter.source}`
    );
  }

  if (farcasterUser.bio) {
    const twitter = await getTwitterFromRaw(farcasterUser.bio, entityId);
    if (twitter) {
      console.log(
        `[${mode}] [${entityId}] added twitter ${twitter.username} from ${twitter.source}`
      );
    }
  }

  return farcasterUser;
};
