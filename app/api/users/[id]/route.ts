import { NextResponse } from "next/server";
import { getIdentityForInput } from "@/lib/identity";
import { getAddressesWithEnsNames, getENSForAddress } from "@/lib/ens";
import prisma from "@/lib/prisma";
import { Account, Entity, EntityText, Link } from "@/lib/types";
import { getLensLinks } from "@/indexer/links/lens";
import {
  getOpenSeaLinks,
  getOpenSeaLinksByUser,
} from "@/indexer/links/opensea";
import { getEnsLinks } from "@/indexer/links/ens";
import { isValidLink, normalizeLink } from "@/indexer/links";

const RELEVANT_PLATFORMS: { [key: string]: string } = {
  "warpcast.com": "Farcaster",
  "twitter.com": "Twitter",
  "instagram.com": "Instagram",
  "opensea.io": "OpenSea",
  "github.com": "GitHub",
  "discord.com": "Discord",
  "reddit.com": "Reddit",
  "linkedin.com": "LinkedIn",
  "t.me": "Telegram",
  "telegram.org": "Telegram",
  "lensfrens.xyz": "Lens",
  "friend.tech": "FriendTech",
};

const PLATFORM_ORDER = [
  "Farcaster",
  "Twitter",
  "Instagram",
  "OpenSea",
  "GitHub",
  "Discord",
  "Reddit",
  "LinkedIn",
  "Telegram",
  "Lens",
  "FriendTech",
  "",
];

const FILTERED_LINKS = ["ipns://", "flink.fyi"];

export async function GET(
  request: Request,
  { params }: { params: { id: string; create: boolean } }
) {
  const { id } = params;
  const url = new URL(request.url);

  const identity = await getIdentityForInput(
    id,
    url.searchParams.get("create") === "true"
  );

  let entity: Entity | undefined;
  let address = identity?.address;
  const entityId = identity?.entityId;

  if (entityId) {
    entity = await handleEntity(entityId);
  } else {
    entity = await buildEntity(id, address);
  }

  if (entity) {
    return NextResponse.json(entity);
  }

  return NextResponse.json({ error: "User not found" }, { status: 404 });
}
export const handleEntity = async (entityId: number): Promise<Entity> => {
  const [farcaster, addresses, links] = await Promise.all([
    prisma.farcaster.findFirst({
      where: { entityId },
    }),
    prisma.ethereum.findMany({
      where: { entityId },
    }),
    prisma.link.findMany({
      where: {
        OR: [
          { entityId, deleted: false },
          {
            entityId,
            url: {
              startsWith: "twitter.com",
            },
          },
          {
            entityId,
            url: {
              startsWith: "x.com",
            },
          },
        ],
      },
    }),
  ]);

  const addressList = addresses.map((address) => address.address);
  const addressesWithEnsNames = await getAddressesWithEnsNames(addressList);
  const ethereum = addressesWithEnsNames.map((address, i) => ({
    chain: "Ethereum",
    address: address.address,
    ensName: address.ensName,
    verified: addresses[i].verified,
  }));

  const { pfps, bios, displays, accounts, relatedLinks, emails } =
    parseLinks(links);

  if (farcaster?.pfp) {
    pfps.unshift({
      value: farcaster.pfp,
      platform: "Farcaster",
    });
  }

  if (farcaster?.bio) {
    bios.unshift({
      value: farcaster.bio,
      platform: "Farcaster",
    });
  }

  if (farcaster?.fname) {
    displays.unshift({
      value: farcaster.fname,
      platform: "Farcaster",
    });
  }

  if (farcaster?.display) {
    displays.unshift({
      value: farcaster.display,
      platform: "Farcaster",
    });
  }

  if (farcaster?.fname) {
    accounts.unshift({
      platform: "Farcaster",
      username: farcaster.fname,
      verified: true,
      link: `warpcast.com/${farcaster.fname}`,
    });
  }

  return {
    fid: farcaster?.fid,
    pfp: pfps.length > 0 ? pfps[0] : undefined,
    bio: bios.length > 0 ? bios[0] : undefined,
    display: displays.length > 0 ? displays[0] : undefined,
    ethereum,
    accounts,
    relatedLinks,
    emails,
  };
};

const buildEntity = async (id: string, address?: string) => {
  const links = [];
  if (!address) {
    const response = await getOpenSeaLinksByUser(id);
    if (response) {
      address = response.address;
      links.push(...response.links);
    }
  }
  if (address) {
    const promises = [getLensLinks(address), getEnsLinks(address)];
    if (!links?.length) {
      promises.push(getOpenSeaLinks(address));
    }
    const results = await Promise.all(promises);
    const [lensLinks, ensLinks, openseaLinks] = results;
    if (openseaLinks) {
      links.push(...openseaLinks);
    }
    links.push(...ensLinks, ...lensLinks);
    const ensName = await getENSForAddress(address);
    return {
      ...parseLinks(links),
      ethereum: [
        {
          chain: "Ethereum",
          address,
          ensName: ensName ? (ensName as string) : undefined,
          verified: true,
        },
      ],
    };
  }
};

const parseLinks = (
  links: { url: string; verified: boolean; metadata?: any }[]
) => {
  const relevantPlatforms = Object.keys(RELEVANT_PLATFORMS);

  const linksWithPlatforms = links
    .map((link) => {
      const noramlizedUrl = (link.url ? normalizeLink(link.url) : "").replace(
        "x.com",
        "twitter.com"
      );
      const platformLink = relevantPlatforms.find((platform) =>
        noramlizedUrl.includes(platform)
      );
      return {
        ...link,
        url: noramlizedUrl,
        platform: platformLink ? RELEVANT_PLATFORMS[platformLink] : undefined,
      };
    })
    .filter(
      (link, i, self) =>
        self.findIndex((l) => l.url === link.url) === i &&
        isValidLink(link.url) &&
        !FILTERED_LINKS.some((filtered) => link.url.includes(filtered))
    )
    .sort((a, b) => {
      const aIndex = PLATFORM_ORDER.indexOf(a.platform || "");
      const bIndex = PLATFORM_ORDER.indexOf(b.platform || "");
      return aIndex - bIndex;
    });

  const accounts: Account[] = [];
  const relatedLinks: Link[] = [];
  const emails: Link[] = [];
  const seenLinks = new Set();
  for (const link of linksWithPlatforms) {
    if (seenLinks.has(link.url)) {
      continue;
    }

    if (!link.platform) {
      if (
        link.url.indexOf("@") >= 0 &&
        link.url.indexOf(".") > link.url.indexOf("@")
      ) {
        emails.push({
          link: link.url,
          verified: link.verified,
        });
      } else {
        relatedLinks.push({
          link: link.url,
          verified: link.verified,
        });
      }
      continue;
    }

    let username = link.url.split("/").pop();
    if (["FriendTech", "OpenSea"].includes(link.platform)) {
      // @ts-ignore
      username = link.metadata?.display;
    }

    if (!username) {
      continue;
    }

    accounts.push({
      platform: link.platform,
      username: username || link.platform,
      link: link.url,
      verified: link.verified,
    });

    seenLinks.add(link.url);
  }

  const getFieldList = (field: string) =>
    linksWithPlatforms
      .map(({ metadata, platform }: any) => {
        if (metadata?.[field]) {
          return {
            value: metadata[field],
            platform: platform,
          };
        }
        return undefined;
      })
      .filter(Boolean) as EntityText[];

  return {
    pfps: getFieldList("pfp"),
    bios: getFieldList("bio"),
    displays: getFieldList("display"),
    accounts,
    relatedLinks,
    emails,
  };
};
