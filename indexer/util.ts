import fetch from "node-fetch";

const MAX_RETRIES = 3;

export const fetchWithRetry = async (
  url: string,
  options?: any,
  retries = MAX_RETRIES
): Promise<any> => {
  try {
    const data = await fetch(url, options);
    if (data.status === 200) {
      return data.json();
    }
  } catch (err: any) {
    if (!err.message.includes("getaddrinfo ENOTFOUND")) {
      console.log(url, err.message);
    }
  }
  if (retries === 0) return undefined;
  await new Promise((r) => setTimeout(r, 1000));
  return await fetchWithRetry(url, options, retries - 1);
};

export const CHAIN_ID_TO_NAME: Record<string, string> = {
  "eip155:42161": "arbitrum",
  "eip155:421613": "arbitrum-goerli",
  "eip155:42170": "arbitrum-nova",
  "eip155:43114": "avalanche",
  "eip155:43113": "avalanche-fuji",
  "eip155:8453": "base",
  "eip155:84531": "base-goerli",
  "eip155:56": "bsc",
  "eip155:97": "bsc-testnet",
  "eip155:42220": "celo",
  "eip155:1": "ethereum",
  "eip155:5": "ethereum-goerli",
  "eip155:4": "ethereum-rinkeby",
  "eip155:11155111": "ethereum-sepolia",
  "eip155:81345": "frame-testnet",
  "eip155:100": "gnosis",
  "eip155:71402": "godwoken",
  "eip155:71401": "godwoken-testnet",
  "eip155:5151706": "loot",
  "eip155:3441005": "manta-testnet",
  "eip155:10": "optimism",
  "eip155:420": "optimism-goerli",
  "eip155:11297108109": "palm",
  "eip155:11297108099": "palm-testnet",
  "eip155:137": "polygon",
  "eip155:80001": "polygon-mumbai",
  "eip155:1101": "polygon-zkevm",
  "eip155:1442": "polygon-zkevm-testnet",
  "eip155:534351": "scroll-sepolia",
  "eip155:534353": "scroll-testnet",
  "eip155:324": "zksync-era",
  "eip155:280": "zksync-era-testnet",
  "eip155:7777777": "zora",
  "eip155:999": "zora-testnet",
};

export const NAME_TO_CHAIN_ID: Record<string, string> = Object.fromEntries(
  Object.entries(CHAIN_ID_TO_NAME).map(([k, v]) => [v, k])
);
