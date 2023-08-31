import { fetchWithRetry } from "../util";

const BASESCAN_URL = "https://api.basescan.org/api";

export const getRelatedWallets = async (address: string): Promise<string[]> => {
  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "100",
    sort: "asc",
    apikey: process.env.BASESCAN_API_KEY as string,
  });

  const data = await fetchWithRetry(`${BASESCAN_URL}?${params}`);
  if (!data?.result) {
    return [];
  }

  const filteredData = data.result.filter(
    (tx: any) =>
      tx.from.toLowerCase() === address.toLowerCase() &&
      tx.value > 0 &&
      tx.input === "0x"
  );

  const addresses = filteredData.map((tx: any) => tx.to.toLowerCase());

  return addresses.filter((v: any, i: any, a: any) => a.indexOf(v) === i);
};
