import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPublicClient, http, isAddress } from "viem";
import { normalize } from "viem/ens";
import { mainnet } from "viem/chains";
import { fetchWithRetry } from "@/indexer/util";

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_RPC_ENDPOINT as string),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let address;
  if (id.endsWith(".lens")) {
    address = await getAddressFromLensHandle(id);
  } else if (id.includes(".")) {
    address = await client.getEnsAddress({
      name: id,
    });
  } else if (id.startsWith("0x") && isAddress(id)) {
    address = id;
  }

  let entityId;
  if (address) {
    const entity = await prisma.ethereum.findFirst({
      where: { address: address.toLowerCase() },
      select: { entityId: true },
    });
    entityId = entity?.entityId;
  }

  if (!entityId) {
    const entity = await prisma.farcaster.findFirst({
      where: { fname: id },
      select: { entityId: true },
    });
    entityId = entity?.entityId;

    if (!entityId) {
      const entity = await prisma.twitter.findFirst({
        where: { username: id },
        select: { entityId: true },
      });
      entityId = entity?.entityId;
    }

    if (!entityId) {
      const entity = await prisma.openSea.findFirst({
        where: { username: id },
        select: { entityId: true },
      });
      entityId = entity?.entityId;
    }
  }

  if (!entityId) {
    // handle only lens
    if (id.endsWith(".lens") && address) {
      const profiles = await getLensProfiles([address]);
      if (profiles) {
        const profile = profiles.find((profile) => profile.twitter);
        const websites = profiles
          .map((profile) => profile.website)
          .filter(Boolean);
        const addresses = profiles
          .map((profile) => profile.address)
          .filter(
            (account, i, self) =>
              self.findIndex((a) => a.address === account.address) === i
          );
        return NextResponse.json({
          accounts: {
            lensProfiles: profiles.map(({ username, bio, display }) => ({
              username,
              bio,
              display,
            })),
          },
          addresses: addresses?.length
            ? await getAddressesWithEnsNames(addresses)
            : undefined,
          websites: websites?.length ? websites : undefined,
          socials: {
            twitter: profile?.twitter,
          },
        });
      }
    } else if (address) {
      const data = await fetchWithRetry(
        `https://api.opensea.io/api/v1/account/${address}`,
        {
          headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
          },
        }
      );

      if (data?.data.profile_image_url) {
        return NextResponse.json({
          accounts: {
            opensea: [
              {
                username: data.data.user.username,
                pfp: data.data.profile_image_url,
              },
            ],
          },
          addresses: await getAddressesWithEnsNames([data.data.address]),
          socials: {
            twitter: data.data.twitter_username,
          },
        });
      }
    } else {
      const data = await fetchWithRetry(
        `https://api.opensea.io/api/v1/user/${id}`,
        {
          headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
          },
        }
      );

      if (data?.username) {
        return NextResponse.json({
          accounts: {
            opensea: [
              {
                username: data.username,
                pfp: data.account.profile_image_url,
              },
            ],
          },
          addresses: await getAddressesWithEnsNames([data.account.address]),
          socials: {
            twitter: data.account.twitter_username,
          },
        });
      }
    }
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const entity = await getEntity(entityId);

  return NextResponse.json(entity);
}

const getEntity = async (entityId: number) => {
  const [
    farcasterAccounts,
    twitterAccounts,
    ethereumAccounts,
    openSeaAccounts,
    websites,
  ] = await Promise.all([
    getEntityFarcasterAccounts(entityId),
    getEntityTwitterAccounts(entityId),
    getEntityEthereumAccounts(entityId),
    getEntityOpenSeaAccounts(entityId),
    getEntityWebsites(entityId),
  ]);

  const addresses = ethereumAccounts.map((account) => account.address);
  const ensNames = ethereumAccounts
    .map((account) => account.ensName)
    .filter(Boolean) as string[];

  const [ensTextRecords, lensProfiles] = await Promise.all([
    getEnsTextRecords(ensNames),
    getLensProfiles(addresses),
  ]);
  const discord = ensTextRecords.find((record) => record.key === "com.discord");
  const github = ensTextRecords.find((record) => record.key === "com.github");
  const reddit = ensTextRecords.find((record) => record.key === "com.reddit");
  const telegram = ensTextRecords.find(
    (record) => record.key === "org.telegram"
  );

  let twitter = twitterAccounts[0];
  if (!twitter && lensProfiles) {
    const profile = lensProfiles.find((profile) => profile.twitter);
    twitter = profile?.twitter;
  }

  const lensWebistes = lensProfiles.map((profile) => profile.website);
  const allWebsites = websites
    .concat(lensWebistes)
    .filter(Boolean)
    .filter((website, i, self) => self.indexOf(website) === i);

  const lensAddresses = await getAddressesWithEnsNames(
    lensProfiles.map((profile) => profile.address)
  );
  const allAddresses = ethereumAccounts
    .concat(lensAddresses)
    .filter(
      (account, i, self) =>
        self.findIndex((a) => a.address === account.address) === i
    );

  return {
    accounts: {
      farcaster: farcasterAccounts[0],
      opensea: openSeaAccounts?.length ? openSeaAccounts : undefined,
      lensProfiles: lensProfiles?.length
        ? lensProfiles.map(({ username, bio, display }) => ({
            username,
            bio,
            display,
          }))
        : undefined,
    },
    addresses: ethereumAccounts?.length ? allAddresses : undefined,
    websites: allWebsites?.length ? allWebsites : undefined,
    socials: {
      twitter: twitterAccounts[0],
      discord,
      github,
      reddit,
      telegram,
    },
  };
};

const getEntityFarcasterAccounts = async (entityId: number) => {
  const farcasterAccounts = await prisma.farcaster.findMany({
    where: { entityId },
  });

  return farcasterAccounts.map((farcasterAccount) => ({
    fid: farcasterAccount.fid,
    fname: farcasterAccount.fname,
    display: farcasterAccount.display,
    pfp: farcasterAccount.pfp,
    bio: farcasterAccount.bio,
  }));
};

const getEntityTwitterAccounts = async (entityId: number) => {
  const twitterAccounts = await prisma.twitter.findMany({
    where: { entityId },
  });

  return twitterAccounts.map((twitterAccount) => twitterAccount.username);
};

const getEntityEthereumAccounts = async (entityId: number) => {
  const ethereumAccounts = await prisma.ethereum.findMany({
    where: { entityId },
  });

  const addresses = ethereumAccounts.map(
    (ethereumAccount) => ethereumAccount.address
  );

  return await getAddressesWithEnsNames(addresses);
};

const getAddressesWithEnsNames = async (addresses: string[]) => {
  const ensNames = await Promise.all(
    addresses.map((address) =>
      client.getEnsName({ address: address as `0x${string}` })
    )
  );

  return addresses.map((address, i) => ({
    address,
    ensName: ensNames[i] || undefined,
  }));
};

const getEntityOpenSeaAccounts = async (entityId: number) => {
  const openseaAccounts = await prisma.openSea.findMany({
    where: { entityId },
  });

  return openseaAccounts
    .map((openseaAccount) => ({
      username: openseaAccount.username,
      pfp: openseaAccount.pfp,
    }))
    .filter(({ username }) => username !== null);
};

const getEntityWebsites = async (entityId: number) => {
  const websites = await prisma.website.findMany({
    where: { entityId },
  });

  return websites
    .map((website) => website.url)
    .filter((s) => !s.includes("twitter"));
};

const getEnsTextRecords = async (ensNames: string[]) => {
  const textRecords = (await Promise.all(ensNames.map(getEnsTextRecord)))
    .flat()
    .filter(Boolean);
  const uniqueTextRecords = textRecords.filter(
    (textRecord, i, self) =>
      self.findIndex((t) => t.key === textRecord.key && t.value === "") === i
  );

  return uniqueTextRecords;
};

const getEnsTextRecord = async (ensName: string) => {
  const { data } = await fetchWithRetry(
    "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
    {
      method: "POST",
      body: JSON.stringify({
        query: `
            query($domain: String!) {
              domains(where:{name: $domain}) { 
                resolver {
                  texts
                }
              }
            }
          `,
        variables: {
          domain: ensName,
        },
      }),
    }
  );

  if (!data?.domains?.length) {
    return [];
  }

  const records = data?.domains[0]?.resolver?.texts?.filter(
    (s: string) => !s.includes("twitter")
  );
  if (!records?.length) {
    return [];
  }

  const values = await Promise.all(
    records.map((record: string) =>
      client.getEnsText({
        name: normalize(ensName),
        key: record,
      })
    )
  );

  return records.map((record: string, i: number) => ({
    key: record,
    value: values[i],
  }));
};

const getLensProfiles = async (addresses: string[]) => {
  const profiles = await Promise.all(
    addresses.map((address) => getLensProfileByAddress(address))
  );
  return profiles.flat().filter(Boolean);
};

const getLensProfileByAddress = async (address: string) => {
  const data = await fetchWithRetry("https://api.lens.dev/", {
    method: "POST",
    body: JSON.stringify({
      query: `
        query($address: EthereumAddress!) {
          profiles(request:{ownedBy:[$address]}) {
            items{
              handle
              bio
              metadata
              ownedBy
              name
            }
          }
        }`,
      variables: {
        address,
      },
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!data?.data?.profiles?.items?.length) {
    return;
  }

  const items = data.data.profiles.items;

  return await Promise.all(
    items.map(async (item: any) => {
      let website;
      let twitter;
      if (item.metadata) {
        const url = item.metadata
          .replace("ar://", "https://arweave.dev/")
          .replace("https://arweave.net", "https://arweave.dev");
        const data = await fetchWithRetry(url);
        if (data) {
          website =
            data?.attributes.find((attr: any) => attr.key === "website")
              ?.value || undefined;
          twitter =
            data?.attributes.find((attr: any) => attr.key === "twitter")
              ?.value || undefined;
        }
      }

      return {
        username: item.handle,
        bio: item.bio || undefined,
        address: item.ownedBy,
        display: item.name || undefined,
        website,
        twitter,
      };
    })
  );
};

const getAddressFromLensHandle = async (handle: string) => {
  const data = await fetchWithRetry("https://api.lens.dev/", {
    method: "POST",
    body: JSON.stringify({
      query: `
        query($handle: Handle!) {
          profiles(request:{handles:[$handle]}) {
            items{
              ownedBy
            }
          }
        }`,
      variables: {
        handle,
      },
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!data?.data?.profiles?.items?.length) {
    return;
  }

  const item = data.data.profiles.items[0];
  if (!item) {
    return;
  }

  return item.ownedBy;
};
