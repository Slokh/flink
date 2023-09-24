import { CHAIN_ID_TO_NAME, fetchWithRetry } from "../util";
import { unfurl } from "unfurl.js";

export const getEmbedMetadata = async (url: string) => {
  let formattedUrl =
    !url.startsWith("https:") &&
    !url.startsWith("http:") &&
    !url.startsWith("chain://")
      ? `https://${url}`
      : url;
  console.log(`[embed] fetching embed metadata for ${formattedUrl}`);
  const [metadata, headMetadata] = await Promise.all([
    getMetadata(formattedUrl),
    getHeadMetadata(formattedUrl),
  ]);

  return {
    ...metadata,
    ...headMetadata,
  };
};

const getHeadMetadata = async (url: string) => {
  if (url.startsWith("chain://")) return {};

  let contentType: string | undefined;
  let contentLength: number | undefined;
  let contentLastModified: Date | undefined;

  try {
    const response = await Promise.race<Response | undefined>([
      fetch(url, { method: "HEAD" }),
      timeout(10000),
    ]);
    if (response?.ok) {
      const headers = response.headers;
      const rawContentType = headers.get("Content-Type");
      const rawContentLength = headers.get("Content-Length");
      const rawLastModified = headers.get("Last-Modified");
      contentType = rawContentType || undefined;
      contentLength = rawContentLength ? parseInt(rawContentLength) : undefined;
      contentLastModified = rawLastModified
        ? new Date(rawLastModified)
        : undefined;
    }
  } catch (e) {}

  return {
    contentType,
    contentLength,
    contentLastModified,
  };
};

const getMetadata = async (url: string) => {
  let contentMetadata = {};
  try {
    if (!url.startsWith("chain://")) {
      contentMetadata = await Promise.race<any>([unfurl(url), timeout(10000)]);
    } else {
      contentMetadata = await Promise.race<any>([
        getNftMetadata(url),
        timeout(10000),
      ]);
    }
  } catch (e) {}

  return {
    contentMetadata,
  };
};

const getNftMetadata = async (url: string) => {
  const [, , chainId, contractAddress, tokenId] = url.split("/");
  const response = await fetchWithRetry(
    `https://api.simplehash.com/api/v0/nfts/${CHAIN_ID_TO_NAME[chainId]}/${
      contractAddress.split(":")[1]
    }/${tokenId}`,
    {
      headers: {
        "X-API-KEY": process.env.SIMPLEHASH_API_KEY as string,
      },
    }
  );
  return await response;
};

const timeout = (ms: number): Promise<Response> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(undefined);
    }, ms);
  });
};
