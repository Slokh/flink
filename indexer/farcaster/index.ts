import { HubEventType } from "@farcaster/hub-nodejs";
import { getHubClient, Client } from "./hub";
import { upsertFarcaster } from "../db/farcaster";
import { upsertEthereum } from "../db/ethereum";
import { URL_REGEX } from "../util";
import { getOpenSeaLinks } from "../links/opensea";
import { getFriendTechLinks } from "../links/friendtech";
import { getEnsLinks } from "../links/ens";
import { Link, upsertLinks } from "../db/link";
import { getNftdLinks } from "../links/nftd";
import { getLensLinks } from "../links/lens";
import prisma from "../lib/prisma";

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
  const lastFidRecord = await prisma.backfill.findFirst({
    orderBy: { fid: "desc" },
    select: { fid: true },
  });

  const lastFid = lastFidRecord?.fid || 0;
  for (let fid = lastFid + 1; ; fid++) {
    if (!(await handleFidChange("backfill", client, fid))) {
      break;
    }
    await prisma.backfill.create({ data: { fid } });
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
  const [farcasterUser, addresses] = await Promise.all([
    client.getFarcasterUser(fid),
    client.getVerifiedAddresses(fid),
  ]);
  if (!farcasterUser) {
    return;
  }

  const entityId = await upsertFarcaster(farcasterUser);

  console.log(
    `[${mode}] [${entityId}] processing fid ${fid} ${farcasterUser.fname}`
  );

  const links: Link[] = [];

  const linkPromises = [];

  if (farcasterUser.bio) {
    const parsedLinks = farcasterUser.bio.match(URL_REGEX) || [];
    for (const parsedLink of parsedLinks) {
      const link = parsedLink.trim();
      if (!link || link.includes(" ")) {
        continue;
      }
      links.push({
        url: link,
        source: "FARCASTER",
        verified: false,
        sourceInput: farcasterUser.fid.toString(),
        metadata: {
          bio: farcasterUser.bio,
        },
      });

      const match = link?.match(/nf\.td\/(\w+)/);
      if (match?.length) {
        const name = match[1];
        linkPromises.push(getNftdLinks(name));
      }
    }
  }

  for (const address of addresses) {
    await upsertEthereum(address, entityId);

    console.log(`[${mode}] [${entityId}] added address ${address.address}`);

    linkPromises.push(getOpenSeaLinks(address.address));
    linkPromises.push(getFriendTechLinks(address.address));
    linkPromises.push(getEnsLinks(address.address));
    linkPromises.push(getLensLinks(address.address));
  }

  const linkResults = (await Promise.all(linkPromises))
    .flat()
    .concat(links)
    .filter(({ url }) => url);

  const normalizedLinkResults = linkResults.map((link) => {
    // normalize link.url
    let url = link.url.trim();
    if (url.startsWith("http://")) {
      url = url.replace("http://", "");
    }
    if (url.startsWith("https://")) {
      url = url.replace("https://", "");
    }
    if (url.startsWith("www.")) {
      url = url.replace("www.", "");
    }
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    return {
      ...link,
      url,
    };
  });

  // deduplicate linkResults by url and source
  const dedupedLinkResults = normalizedLinkResults.filter(
    (link, index, self) =>
      index ===
        self.findIndex((l) => l.url === link.url && l.source === link.source) &&
      link.url.match(URL_REGEX)
  );

  await upsertLinks(entityId, dedupedLinkResults);
  for (const link of dedupedLinkResults) {
    console.log(
      `[${mode}] [${entityId}] added link ${link.url} ${link.source}`
    );
  }

  return farcasterUser;
};
