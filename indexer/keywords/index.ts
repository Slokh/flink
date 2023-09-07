import { fetchWithRetry } from "../util";
import { Cast } from "../db/cast";
import { Keyword } from "../db/keyword";

const YAKE_API_URL = "https://yake-production.up.railway.app/yake/";

export const extractKeywords = async (cast: Cast): Promise<Keyword[]> => {
  const text = cast.text.trim().replace(/\n/g, " ");
  if (!text) {
    return [];
  }

  const keywords = await fetchWithRetry(YAKE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "en",
      max_ngram_size: 2,
      number_of_keywords: 20,
      text,
    }),
  });

  if (!keywords) {
    return [];
  }

  return keywords?.map((keyword: { ngram: string; score: number }) => ({
    fid: cast.fid,
    hash: cast.hash,
    timestamp: cast.timestamp,
    keyword: keyword.ngram,
    score: keyword.score,
  }));
};
