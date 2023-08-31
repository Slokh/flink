import { fetchWithRetry } from "../util";

const BLOCKSCOUT_URL = "https://base.blockscout.com/api/v2/addresses";

export const getRelatedWallets = async (address: string): Promise<string[]> => {
  const data = await fetchWithRetry(
    `${BLOCKSCOUT_URL}/${address}/transactions?filter=from`
  );
  if (!data?.items) {
    return [];
  }

  const filteredData = data.items.filter(
    (tx: any) =>
      tx.from.hash.toLowerCase() === address.toLowerCase() &&
      tx.value != "0" &&
      tx.raw_input == "0x"
  );

  const addresses = filteredData.map((tx: any) => tx.to.hash.toLowerCase());

  return addresses.filter((v: any, i: any, a: any) => a.indexOf(v) === i);
};
