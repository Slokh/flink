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
    filteredRecords.map((record: string) =>
      client.getEnsText({
        name: normalize(ensName),
        key: record,
      })
    )
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

  let url = record.value.split(" ")[0];
  if (record.key === "com.twitter") {
    url = `https://twitter.com/${record.value}`;
  } else if (record.key === "com.github") {
    url = `https://github.com/${record.value}`;
  } else if (record.key === "com.reddit") {
    url = `https://reddit.com/u/${record.value}`;
  } else if (record.key === "com.discord") {
    url = `https://discord.com/${record.value}`;
  } else if (record.key === "com.instagram") {
    url = `https://instagram.com/${record.value}`;
  } else if (record.key === "org.telegram") {
    url = `https://t.me/${record.value}`;
  } else if (record.key === "com.medium") {
    url = `https://medium.com/${record.value}`;
  }

  return {
    url,
    verified: false,
    source: "ENS",
    sourceInput: `${record.key}:${record.value}`,
    metadata: record,
  };
};
