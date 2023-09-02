import { fetchWithRetry } from "../util";
import { Link } from "../db/link";

const OPENSEA_URL = "https://api.opensea.io/api/v1";

export const getOpenSeaLinks = async (address: string): Promise<Link[]> => {
  const response = await fetchWithRetry(`${OPENSEA_URL}/account/${address}`, {
    headers: {
      "X-API-KEY": process.env.OPENSEA_API_KEY,
    },
  });

  if (!response?.data || !response.data.user) {
    return [];
  }

  return handleOpenSeaResponse(response.data);
};

export const getOpenSeaLinksByUser = async (username: string) => {
  const response = await fetchWithRetry(`${OPENSEA_URL}/user/${username}`, {
    headers: {
      "X-API-KEY": process.env.OPENSEA_API_KEY,
    },
  });

  if (!response?.account) {
    return;
  }

  return {
    address: response.account.address,
    links: handleOpenSeaResponse(response.account),
  };
};

const handleOpenSeaResponse = (data: any): Link[] => {
  const links: Link[] = [
    {
      url: `https://opensea.io/${data.user?.username || data.address}`,
      verified: true,
      source: "OPENSEA",
      sourceInput: data.address,
      metadata: {
        pfp: data.profile_image_url || undefined,
        verified: data.config === "true",
        display: data.user?.username || undefined,
      },
    },
  ];

  if (data.twitter_username) {
    links.push({
      url: `https://twitter.com/${data.twitter_username}`,
      verified: true,
      source: "OPENSEA",
      sourceInput: data.address,
    });
  }

  if (data.website_url) {
    links.push({
      url: data.website_url,
      verified: data.config === "true",
      source: "OPENSEA",
      sourceInput: data.address,
    });
  }

  return links;
};
