import { Twitter } from "../db/twitter";
import { fetchWithRetry } from "../util";

const OPENSEA_URL = "https://api.opensea.io/api/v1/account";

export const getTwitterFromOpenSea = async (
  address: string
): Promise<Twitter | undefined> => {
  const response = await fetchWithRetry(`${OPENSEA_URL}/${address}`, {
    headers: {
      "X-API-KEY": process.env.OPENSEA_API_KEY,
    },
  });

  if (response?.data?.twitter_username) {
    return {
      username: response.data.twitter_username,
      source: "OPENSEA",
      verified: true,
    };
  }
};
