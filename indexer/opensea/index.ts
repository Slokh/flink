import { Twitter, upsertTwitter } from "../db/twitter";
import { OpenSea, upsertOpenSea } from "../db/opensea";
import { Website, upsertWebsite } from "../db/website";
import { fetchWithRetry } from "../util";

const OPENSEA_URL = "https://api.opensea.io/api/v1/account";

export const getOpenSeaFromAddress = async (
  entityId: number,
  address: string
): Promise<OpenSea | undefined> => {
  const response = await fetchWithRetry(`${OPENSEA_URL}/${address}`, {
    headers: {
      "X-API-KEY": process.env.OPENSEA_API_KEY,
    },
  });

  if (!response?.data || !response.data.user) {
    return undefined;
  }

  if (response.data.twitter_username) {
    const twitter: Twitter = {
      username: response.data.twitter_username,
      source: "OPENSEA",
      verified: true,
    };
    await upsertTwitter(twitter, entityId);
  }

  if (response.data.website_url) {
    const website: Website = {
      url: response.data.website_url,
      source: "OPENSEA",
      verified: response.data.config === "true" ? true : false,
    };
    await upsertWebsite(website, entityId);
  }

  const opensea: OpenSea = {
    address,
    username: response.data.user?.username,
    pfp: response.data.profile_image_url,
    isVerified: response.data.config === "true" ? true : false,
    source: "OPENSEA",
    verified: true,
  };

  await upsertOpenSea(opensea, entityId);

  return opensea;
};
