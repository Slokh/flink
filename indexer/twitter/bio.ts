import { Twitter } from "../db/twitter";

export const getTwitterFromBio = async (
  bio: string
): Promise<Twitter | undefined> => {
  const match1 = bio?.match(/(\w+)\.twitter/);
  if (match1?.length) {
    const username = match1[1];
    return {
      username,
      source: "FARCASTER",
      verified: false,
    };
  }

  const match2 = bio?.match(/twitter\.com\/(\w+)/);
  if (match2?.length) {
    const username = match2[1];
    return {
      username,
      source: "FARCASTER",
      verified: false,
    };
  }
};
