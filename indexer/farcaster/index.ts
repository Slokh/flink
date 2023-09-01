import { HubEventType } from "@farcaster/hub-nodejs";
import { getHubClient, Client } from "./hub";
import { upsertFarcaster } from "../db/farcaster";
import { upsertEthereum } from "../db/ethereum";
import { getTwitterFromAddress, getTwitterFromURL } from "../twitter";
import { getOpenSeaFromAddress } from "../opensea";
import { upsertWebsite } from "../db/website";
import { URL_REGEX } from "../util";

export const runFarcasterIndexer = async () => {
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

export const runForFid = async (fid: number) => {
  const client = await getHubClient();
  await handleFidChange("manual", client, fid);
};

const backfill = async (client: Client) => {
  const lastFid = 1780;
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
  mode: "backfill" | "live" | "manual",
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

    const opensea = await getOpenSeaFromAddress(entityId, address.address);

    if (opensea) {
      console.log(
        `[${mode}] [${entityId}] added opensea ${
          opensea.username || opensea.address
        }`
      );
    }

    const twitter = await getTwitterFromAddress(entityId, address.address);

    if (!twitter) continue;

    console.log(
      `[${mode}] [${entityId}] added twitter ${twitter.username} from ${twitter.source}`
    );
  }

  if (farcasterUser.bio) {
    const links = farcasterUser.bio.match(URL_REGEX) || [];
    for (const link of links) {
      const twitter = await getTwitterFromURL(entityId, link);
      if (twitter) {
        console.log(
          `[${mode}] [${entityId}] added twitter ${twitter.username} from ${twitter.source}`
        );
      }

      await upsertWebsite(
        {
          url: link,
          verified: false,
          source: "FARCASTER",
        },
        entityId
      );
    }
  }

  return farcasterUser;
};
