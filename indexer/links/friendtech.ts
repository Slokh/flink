import { Link } from "../db/link";
import { fetchWithRetry } from "../util";
import { getRelatedWallets } from "../wallets/blockscout";

const FRIEND_TECH_URL = "https://prod-api.kosetto.com/users";

export const getFriendTechLinks = async (address: string): Promise<Link[]> => {
  const relatedWallets = await getRelatedWallets(address);

  const promises = relatedWallets.map((address: string) =>
    fetchWithRetry(`${FRIEND_TECH_URL}/${address}`)
  );

  try {
    const data = await Promise.all(promises);
    const links = data
      .map((data) => {
        if (data?.twitterUsername) {
          return [
            {
              url: `https://twitter.com/${data.twitterUsername}`,
              verified: true,
              source: "FRIEND_TECH",
              sourceInput: address,
              metadata: {
                pfp: data.twitterPfpUrl,
                display: data.twitterName,
              },
            },
            {
              url: `https://www.friend.tech/rooms/${data.address}`,
              verified: true,
              source: "FRIEND_TECH",
              sourceInput: address,
              metadata: {
                pfp: data.twitterPfpUrl,
                display: data.twitterName,
              },
            },
          ];
        }
      })
      .flat()
      .filter((link) => link !== undefined) as Link[];
    return links;
  } catch (err) {}

  return [];
};
