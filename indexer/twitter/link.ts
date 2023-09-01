import { Twitter } from "../db/twitter";

export const getTwitterFromLink = async (
  link: string
): Promise<Twitter | undefined> => {
  const match1 = link.match(/(\w+)\.twitter/);
  if (match1?.length) {
    const username = match1[1];
    return {
      username,
      source: "FARCASTER",
      verified: false,
    };
  }

  const match2 = link.match(/twitter\.com\/(\w+)/);
  if (match2?.length) {
    const username = match2[1];
    return {
      username,
      source: "FARCASTER",
      sourceInput: link,
      verified: false,
    };
  }
};
