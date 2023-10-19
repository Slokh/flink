import { fetchWithRetry } from "../util";

export const getNftMetadata = async (
  chain: string,
  contractAddress: string,
  tokenId: string
) => {
  const response = await fetchWithRetry(
    `https://api.simplehash.com/api/v0/nfts/${chain}/${contractAddress}/${tokenId}`,
    {
      headers: {
        "X-API-KEY": process.env.SIMPLEHASH_API_KEY as string,
      },
    }
  );
  return await response;
};
