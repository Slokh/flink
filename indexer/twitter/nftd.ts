import { Twitter } from "../db/twitter";
import { fetchWithRetry } from "../util";

const NFTD_URL = "https://nf.td/api/public/v1/user";

export const getTwitterFromNftd = async (
  link: string
): Promise<Twitter | undefined> => {
  const match = link?.match(/nf\.td\/(\w+)/);
  if (!match?.length) {
    return;
  }

  const name = match[1];

  const data = await fetchWithRetry(`${NFTD_URL}?name=${name}`, {
    headers: {
      Authorization: process.env.NFTD_API_KEY as string,
    },
  });
  if (!data?.data) {
    return;
  }

  const primarySocial = data.data[0]?.primary_social;

  if (primarySocial?.length > 0 && primarySocial[0].subtype === "twitter") {
    return {
      username: primarySocial[0].username,
      source: "NFTD",
      verified: false,
    };
  }

  const content = data.data[0].content;
  if (!content) {
    return;
  }

  const links = data.data[0].content
    .map(({ url }: { url: string }) => url)
    .filter(Boolean);

  const twitterLinks = links.filter((link: string) => link.includes("twitter"));
  if (twitterLinks.length === 0) {
    return;
  }

  return {
    username: twitterLinks[0].split("/").pop() as string,
    source: "NFTD",
    sourceInput: link,
    verified: false,
  };
};
