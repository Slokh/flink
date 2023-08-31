import { createPublicClient, http } from "viem";
import { Twitter } from "../db/twitter";
import { mainnet } from "viem/chains";
import { fetchWithRetry } from "../util";
import { normalize } from "viem/ens";

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_RPC_ENDPOINT as string),
});

export const getTwitterFromEns = async (
  address: string
): Promise<Twitter | undefined> => {
  const ensName = await client.getEnsName({
    address: address as `0x${string}`,
  });

  if (!ensName) {
    return;
  }

  const records = await getEnsTextRecords(ensName);
  const twitterRecords = records?.filter((text) => text.includes("twitter"));
  if (!twitterRecords?.length) {
    return;
  }

  const usernames = await getUsernames(ensName, twitterRecords);

  if (!usernames?.length) {
    return;
  }

  return {
    username: usernames[0],
    source: "ENS",
    verified: false,
  };
};

const getEnsTextRecords = async (ensName: string): Promise<string[]> => {
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

  return data?.domains[0]?.resolver?.texts;
};

const getUsernames = async (
  ensName: string,
  records: string[]
): Promise<string[]> => {
  const rawUsernames = await Promise.all(
    records.map((record: string) =>
      client.getEnsText({
        name: normalize(ensName),
        key: record,
      })
    )
  );

  return (rawUsernames.filter(Boolean) as string[]).map(formatUsername);
};

const formatUsername = (record: string): string => {
  if (record.startsWith("@")) {
    return record.slice(1);
  } else if (record.includes("twitter.com")) {
    return record.split("/").pop() as string;
  }
  return record;
};
