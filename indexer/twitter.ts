import { fetchWithRetry } from "./util";
import { fetchRelatedWallets } from "./blockscout";
import { createPublicClient, http } from "viem";
import { normalize } from "viem/ens";
import { mainnet } from "viem/chains";

const OPENSEA_URL = "https://api.opensea.io/api/v1/account";
const FRIEND_TECH_URL = "https://prod-api.kosetto.com/users";
const NFTD_URL = "https://nf.td/api/public/v1/user";

export type TwitterSources = "OPENSEA" | "FRIEND_TECH" | "NFTD" | "ENS" | "BIO";

export type TwitterInfo = {
  twitterUsername: string;
  twitterSource: TwitterSources;
};

export const fetchTwitterInfo = async (
  address: string,
  bio?: string
): Promise<TwitterInfo | undefined> => {
  // try to fetch using address
  const twitterInfo =
    (await fetchTwitterInfoFromFriendTech(address)) ||
    (await fetchTwitterInfoFromOpenSea(address)) ||
    (await fetchTwitterInfoFromENS(address));

  if (twitterInfo) {
    return twitterInfo;
  }

  // try to fetch using bio
  if (bio) {
    const twitterInfo =
      (await fetchTwitterInfoFromBio(bio)) ||
      (await fetchTwitterInfoFromNftd(bio));
    return twitterInfo;
  }

  return twitterInfo;
};

const fetchTwitterInfoFromOpenSea = async (
  address: string
): Promise<TwitterInfo | undefined> => {
  const response = await fetchWithRetry(`${OPENSEA_URL}/${address}`, {
    headers: {
      "X-API-KEY": process.env.OPENSEA_API_KEY,
    },
  });

  if (response?.data?.twitter_username) {
    return {
      twitterUsername: response.data.twitter_username,
      twitterSource: "OPENSEA",
    };
  }
};

const fetchTwitterInfoFromFriendTech = async (
  address: string
): Promise<TwitterInfo | undefined> => {
  const relatedWallets = await fetchRelatedWallets(address);

  const promises = relatedWallets.map((address: string) =>
    fetchWithRetry(`${FRIEND_TECH_URL}/${address}`)
  );

  try {
    const data = await Promise.any(promises);
    if (data?.twitterUsername) {
      return {
        twitterUsername: data.twitterUsername,
        twitterSource: "FRIEND_TECH",
      };
    }
  } catch (err) {}
};

const fetchTwitterInfoFromBio = async (
  bio: string
): Promise<TwitterInfo | undefined> => {
  const match1 = bio?.match(/(\w+)\.twitter/);
  if (match1?.length) {
    const twitterUsername = match1[1];
    return {
      twitterUsername,
      twitterSource: "BIO",
    };
  }

  const match2 = bio?.match(/twitter\.com\/(\w+)/);
  if (match2?.length) {
    const twitterUsername = match2[1];
    return {
      twitterUsername,
      twitterSource: "BIO",
    };
  }
};

const fetchTwitterInfoFromNftd = async (
  bio: string
): Promise<TwitterInfo | undefined> => {
  const match = bio?.match(/nf\.td\/(\w+)/);
  if (!match?.length) {
    return;
  }

  const name = match[1];

  const data = await fetchWithRetry(`${NFTD_URL}?name=${name}`, {
    headers: {
      Authorization: process.env.NFTD_API_KEY as string,
    },
  });
  if (!data?.data) {
    return;
  }

  const primarySocial = data.data[0]?.primary_social;

  if (primarySocial?.length > 0 && primarySocial[0].subtype === "twitter") {
    return {
      twitterUsername: primarySocial[0].username,
      twitterSource: "NFTD",
    };
  }

  const content = data.data[0].content;
  if (!content) {
    return;
  }

  const links = data.data[0].content
    .map(({ url }: { url: string }) => url)
    .filter(Boolean);

  const twitterLinks = links.filter((link: string) => link.includes("twitter"));
  if (twitterLinks.length === 0) {
    return;
  }

  return {
    twitterUsername: twitterLinks[0].split("/").pop() as string,
    twitterSource: "NFTD",
  };
};

const fetchTwitterInfoFromENS = async (
  address: string
): Promise<TwitterInfo | undefined> => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.ETH_RPC_ENDPOINT as string),
  });

  const ensName = await client.getEnsName({
    address: address as `0x${string}`,
  });

  if (!ensName) {
    return;
  }

  // get ens text records for the given ens name / address using a subgraph
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
    return;
  }

  const texts = data?.domains[0]?.resolver?.texts;
  const twitterRecords = texts?.filter((text: string) =>
    text.includes("twitter")
  );

  if (!twitterRecords?.length) {
    return;
  }

  const twitterNames = await Promise.all(
    twitterRecords.map((record: string) =>
      client.getEnsText({
        name: normalize(ensName),
        key: record,
      })
    )
  );

  const twitter = twitterNames.find(Boolean);

  if (!twitter) {
    return;
  }

  if (twitter.startsWith("@")) {
    return {
      twitterUsername: twitter.slice(1),
      twitterSource: "ENS",
    };
  } else if (twitter.includes("twitter.com")) {
    return {
      twitterUsername: twitter.split("/").pop() as string,
      twitterSource: "ENS",
    };
  }

  return {
    twitterUsername: twitter,
    twitterSource: "ENS",
  };
};
