import { Twitter } from "../db/twitter";
import { fetchWithRetry } from "../util";
import { getRelatedWallets } from "../wallets/blockscout";

const FRIEND_TECH_URL = "https://prod-api.kosetto.com/users";

export const getTwitterFromFriendTech = async (
  address: string
): Promise<Twitter | undefined> => {
  const relatedWallets = await getRelatedWallets(address);

  const promises = relatedWallets.map((address: string) =>
    fetchWithRetry(`${FRIEND_TECH_URL}/${address}`)
  );

  try {
    const data = await Promise.any(promises);
    if (data?.twitterUsername) {
      return {
        username: data.twitterUsername,
        source: "FRIEND_TECH",
        verified: true,
      };
    }
  } catch (err) {}
};
