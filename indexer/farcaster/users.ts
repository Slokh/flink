import { Client } from "./hub";
import { upsertFarcaster } from "../db/farcaster";
import { upsertEthereum } from "../db/ethereum";
import { getOpenSeaLinks } from "../links/opensea";
import { getFriendTechLinks } from "../links/friendtech";
import { getEnsLinks } from "../links/ens";
import { Link, upsertLinks } from "../db/link";
import { getNftdLinks } from "../links/nftd";
import { getLensLinks } from "../links/lens";
import { getAddressForENS } from "../links/ens";
import { extractLinks, isValidLink, normalizeLink } from "../links";
import { getZoraLinks } from "../links/zora";

export const handleUserUpdate = async (client: Client, fid: number) => {
  const [farcasterUser, addresses] = await Promise.all([
    client.getFarcasterUser(fid),
    client.getVerifiedAddresses(fid),
  ]);
  if (!farcasterUser) {
    return;
  }

  const entityId = await upsertFarcaster(farcasterUser);

  const links: Link[] = [];

  const linkPromises = [];

  const parsedLinks = extractLinks(farcasterUser.bio);
  for (const link of parsedLinks) {
    links.push({
      url: link,
      source: "FARCASTER",
      verified: false,
      sourceInput: farcasterUser.fid.toString(),
      metadata: {
        bio: farcasterUser.bio,
      },
    });

    const match = link.match(/nf\.td\/(\w+)/);
    if (match?.length) {
      const name = match[1];
      linkPromises.push(getNftdLinks(name));
    }
  }

  let linksShouldBeUnverified = false;
  if (!addresses?.length && farcasterUser.display?.endsWith(".eth")) {
    const address = await getAddressForENS(farcasterUser.display);
    if (address) {
      addresses.push({
        address,
        verified: false,
        source: "FARCASTER",
      });
      linksShouldBeUnverified = true;
    }
  }

  for (const address of addresses) {
    await upsertEthereum(address, entityId);

    linkPromises.push(getOpenSeaLinks(address.address));
    linkPromises.push(getFriendTechLinks(address.address));
    linkPromises.push(getEnsLinks(address.address));
    linkPromises.push(getLensLinks(address.address));
    linkPromises.push(getZoraLinks(address.address));
  }

  const linkResults = (await Promise.all(linkPromises)).flat().concat(links);

  const normalizedLinkResults = linkResults.map((link) => ({
    ...link,
    url: link.url ? normalizeLink(link.url) : "",
    verified: link.verified && !linksShouldBeUnverified,
  }));

  // deduplicate linkResults by url and source
  const dedupedLinkResults = normalizedLinkResults.filter(
    (link, index, self) =>
      index ===
        self.findIndex((l) => l.url === link.url && l.source === link.source) &&
      isValidLink(link.url)
  );

  await upsertLinks(entityId, dedupedLinkResults);

  console.log(
    `[live] [user-update] [${fid}] processed for entity ${entityId} ${farcasterUser.fname}`
  );

  return entityId;
};
