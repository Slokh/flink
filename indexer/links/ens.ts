import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { fetchWithRetry } from "../util";
import { normalize } from "viem/ens";
import { Link } from "../db/link";

type EnsRecord = {
  key: string;
  value: string;
};

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_RPC_ENDPOINT as string),
});

export const getAddressForENS = async (input: string) => {
  return await client.getEnsAddress({
    name: input,
  });
};

export const getEnsLinks = async (address: string): Promise<Link[]> => {
  const ensName = await client.getEnsName({
    address: address as `0x${string}`,
  });

  if (!ensName) {
    return [];
  }

  const records = await getEnsTextRecords(ensName);

  return records
    .map(recordsAsLinks)
    .filter((link) => link && link.url) as Link[];
};

const getEnsTextRecords = async (ensName: string): Promise<EnsRecord[]> => {
  if (ensName.includes("[") || ensName.includes("]")) {
    return [];
  }

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

  const records = data?.domains[0]?.resolver?.texts;
  if (!records?.length) {
    return [];
  }

  const filteredRecords = records.filter(
    (record: string) => !["avatar"].includes(record)
  );

  const values = await Promise.all(
    filteredRecords.map((record: string) => {
      try {
        return client.getEnsText({
          name: normalize(ensName),
          key: record,
        });
      } catch (e) {}
    })
  );

  return filteredRecords.map((record: string, i: number) => ({
    key: record,
    value: values[i],
  }));
};

const recordsAsLinks = (record: EnsRecord): Link | undefined => {
  if (!record.value) {
    return;
  }

  const recordsToUrls = {
    "com.twitter": "https://twitter.com/",
    "com.github": "https://github.com/",
    "com.reddit": "https://reddit.com/u/",
    "com.discord": "https://discord.com/",
    "com.instagram": "https://instagram.com/",
    "org.telegram": "https://t.me/",
    "com.medium": "https://medium.com/",
  };

  let url = record.value.split(" ")[0];
  for (const [key, value] of Object.entries(recordsToUrls)) {
    if (record.key === key) {
      if (url.startsWith(value)) {
      } else if (url.startsWith(value.replace("https://", ""))) {
        url = "https://" + url;
      } else {
        url = value + url;
      }
      break;
    }
  }

  return {
    url,
    verified: false,
    source: "ENS",
    sourceInput: `${record.key}:${record.value}`,
    metadata: record,
  };
};
