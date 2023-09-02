import { fetchWithRetry } from "../util";
import { Link } from "../db/link";

const NFTD_URL = "https://nf.td/api/public/v1/user";

export const getNftdLinks = async (name: string): Promise<Link[]> => {
  const data = await fetchWithRetry(`${NFTD_URL}?name=${name}`, {
    headers: {
      Authorization: process.env.NFTD_API_KEY as string,
    },
  });
  if (!data?.data) {
    return [];
  }

  const content = data.data[0]?.content || [];
  const links: Link[] = content
    .filter(({ type }: { type: string }) => type === "link")
    .map(({ url, verified }: { url: string; verified: boolean }) => ({
      url,
      source: "NFTD",
      verified: verified === true,
      sourceInput: name,
    }));

  return links;
};
