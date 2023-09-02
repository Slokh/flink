import { fetchWithRetry } from "@/indexer/util";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_RPC_ENDPOINT as string),
});

export const getAddressForENS = async (input: string) => {
  return await client.getEnsAddress({
    name: input,
  });
};

export const getENSForAddress = async (address: string) => {
  return await client.getEnsName({ address: address as `0x${string}` });
};

export const getAddressesWithEnsNames = async (addresses: string[]) => {
  const ensNames = await Promise.all(addresses.map(getENSForAddress));

  return addresses.map((address, i) => ({
    address,
    ensName: ensNames[i] || undefined,
  }));
};

export const getEnsTextRecords = async (ensNames: string[]) => {
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
