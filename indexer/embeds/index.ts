import prisma from "../lib/prisma";
import { CHAIN_ID_TO_NAME, fetchWithRetry } from "../util";
import { unfurl } from "unfurl.js";
import { getTransactionMetadata } from "./transactions";
import { getNftMetadata } from "./nft";

export const getEmbedMetadata = async (url: string) => {
  let formattedUrl =
    !url.startsWith("https:") &&
    !url.startsWith("http:") &&
    !url.startsWith("chain://")
      ? `https://${url}`
      : url;

  console.log(`[embed] fetching embed metadata for ${formattedUrl}`);
  const [metadata, headMetadata, transactionMetadata] = await Promise.all([
    getMetadata(formattedUrl),
    getHeadMetadata(formattedUrl),
    Promise.resolve(undefined),
    // getTransactionMetadata(formattedUrl),
  ]);

  return {
    ...metadata,
    ...headMetadata,
    transactionMetadata,
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
    if (
      (url.includes("warpcast.com") || url.includes("flink.fyi")) &&
      url.match(/0x[0-9a-fA-F]+$/i)
    ) {
      const split = url.split("/");
      const hash = split[split.length - 1];

      const cast = await prisma.farcasterCast.findFirst({
        where: {
          hash: {
            startsWith: hash,
          },
        },
        include: {
          mentions: true,
          urlEmbeds: true,
        },
      });

      if (cast) {
        const user = await prisma.farcaster.findFirst({
          where: {
            fid: cast.fid,
          },
        });
        const mentions = await prisma.farcaster.findMany({
          where: {
            fid: {
              in: cast.mentions.map((m) => m.mention),
            },
          },
        });
        const mentionsMap = mentions.reduce((acc, m) => {
          acc[m.fid] = m;
          return acc;
        }, {} as Record<number, any>);
        contentMetadata = {
          user,
          cast: {
            ...cast,
            mentions: cast.mentions.map((m) => ({
              mention: mentionsMap[m.mention],
              position: m.mentionPosition,
            })),
          },
        };
      }
    } else if (!url.startsWith("chain://")) {
      contentMetadata = await Promise.race<any>([unfurl(url), timeout(10000)]);
    } else {
      const [, , chainId, contractAddress, tokenId] = url.split("/");
      contentMetadata = await Promise.race<any>([
        // getNftMetadata(
        //   CHAIN_ID_TO_NAME[chainId],
        //   contractAddress.split(":")[1],
        //   tokenId
        // ),
        timeout(10000),
      ]);
    }
  } catch (e) {}

  return {
    contentMetadata,
  };
};

const timeout = (ms: number): Promise<Response> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(undefined);
    }, ms);
  });
};
