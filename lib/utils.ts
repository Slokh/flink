import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
