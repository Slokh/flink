import { Link } from "@/db/link";
import { createPublicClient, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";

export const getZoraLinks = async (address: string) => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.ALCHEMY_API_KEY),
  });

  const extension = await client.readContract({
    address: "0xABCDEFEd93200601e1dFe26D6644758801D732E8",
    abi: parseAbi([
      "function getJSONExtension(address) external view returns (string memory)",
    ]),
    functionName: "getJSONExtension",
    args: [address as `0x${string}`],
  });

  if (!extension) {
    return [];
  }

  const parsedExtension = extension
    .replace("ipfs://", "https://ipfs.io/ipfs/")
    .replace("ar://", "https://arweave.dev/");

  const data = await (await fetch(parsedExtension)).json();

  if (!data?.links) {
    return [];
  }

  const urls = [];
  if (data.links.twitter) {
    urls.push(
      `https://twitter.com/${data.links.twitter
        .replace("https://", "")
        .replace("http://", "")}`
    );
  }

  if (data.links.instagram) {
    urls.push(
      `https://instagram.com/${data.links.instagram
        .replace("https://", "")
        .replace("http://", "")}`
    );
  }

  if (data.links.tiktok) {
    urls.push(
      `https://tiktok.com/${data.links.tiktok
        .replace("https://", "")
        .replace("http://", "")}`
    );
  }

  if (data.links.discord) {
    urls.push(
      `https://discord.gg/${data.links.discord
        .replace("https://", "")
        .replace("http://", "")}`
    );
  }

  if (data.links.website) {
    urls.push(data.links.website);
  }

  if (data.links.github) {
    urls.push(data.links.github);
  }

  const links: Link[] = urls.map((url) => ({
    url,
    source: "ZORA",
    sourceInput: address,
    verified: false,
    metadata: {
      url: parsedExtension,
    },
  }));

  return links;
};
