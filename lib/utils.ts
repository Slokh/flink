import { type ClassValue, clsx } from "clsx";
import { SiweMessage } from "siwe";
import { twMerge } from "tailwind-merge";
import { Embed, FarcasterMention } from "./types";
import { eachDayOfInterval, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const formatSiweMessage = (message: SiweMessage) => {
  const header = `${message.domain} wants you to sign in with your Ethereum account:`;
  const uriField = `URI: ${message.uri}`;
  let prefix = [header, message.address].join("\n");
  const versionField = `Version: ${message.version}`;

  const chainField = `Chain ID: ` + message.chainId || "1";

  const nonceField = `Nonce: ${message.nonce}`;

  const suffixArray = [uriField, versionField, chainField, nonceField];

  message.issuedAt = message.issuedAt || new Date().toISOString();

  suffixArray.push(`Issued At: ${message.issuedAt}`);

  if (message.expirationTime) {
    const expiryField = `Expiration Time: ${message.expirationTime}`;

    suffixArray.push(expiryField);
  }

  if (message.notBefore) {
    suffixArray.push(`Not Before: ${message.notBefore}`);
  }

  if (message.requestId) {
    suffixArray.push(`Request ID: ${message.requestId}`);
  }

  if (message.resources) {
    suffixArray.push(
      [`Resources:`, ...message.resources.map((x) => `- ${x}`)].join("\n")
    );
  }

  const suffix = suffixArray.join("\n");
  prefix = [prefix, message.statement].join("\n\n");
  if (message.statement) {
    prefix += "\n";
  }
  return [prefix, suffix].join("\n");
};

export const formatText = (
  text: string,
  mentions: FarcasterMention[],
  withLinks: boolean
) => {
  let offset = 0;
  let updatedMentionsPositions = []; // Array to store updated positions

  // Convert text to a Buffer object to deal with bytes
  let textBuffer = Buffer.from(text.replaceAll(/\uFFFC/g, ""), "utf-8");

  const sortedMentions = mentions.sort((a, b) => b.position - a.position);

  for (let i = 0; i < sortedMentions.length; i++) {
    if (!sortedMentions[i].mention) continue;
    // Assuming mentionsPositions consider newlines as bytes, so no newline adjustment
    const adjustedMentionPosition = sortedMentions[i].position;
    const mentionUsername = sortedMentions[i].mention.fname;

    const mentionLink = withLinks
      ? `<a href="/${mentionUsername}" class="current relative hover:underline text-purple-600 dark:text-purple-400">@${mentionUsername}</a>`
      : `<span class="current relative text-purple-600 dark:text-purple-400">@${mentionUsername}</span>`;
    const mentionLinkBuffer = Buffer.from(mentionLink, "utf-8");

    // Apply the offset only when slicing the text
    const actualPosition = adjustedMentionPosition;

    const beforeMention = textBuffer.slice(0, actualPosition);
    const afterMention = textBuffer.slice(actualPosition);

    // Concatenating buffers
    textBuffer = Buffer.concat([
      beforeMention,
      mentionLinkBuffer,
      afterMention,
    ]);

    // Update the offset based on the added mention
    offset += mentionLinkBuffer.length;

    // Store the adjusted position in the new array
    updatedMentionsPositions.push(actualPosition);
  }

  // Convert the final Buffer back to a string
  text = textBuffer.toString("utf-8");

  // Replace urls with anchor tags
  const matches = text.match(
    /\b(?:https?:\/\/|www\.|ftp:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?\b/gi
  );
  if (matches) {
    matches.forEach((url) => {
      if (
        url.endsWith(".eth") ||
        !isNaN(Number(url)) ||
        url.length < 5 ||
        url === "mint.fun"
      ) {
        return;
      }

      if (
        (url.includes("warpcast.com") || url.includes("flink.fyi")) &&
        url.match(/0x[0-9a-fA-F]+$/i)
      ) {
        text = text.replace(url, "");
        return;
      }

      url = url.split(/[\s\n]+/)[0];

      let originalUrl = url;
      if (text.includes(`https://www.${url}`)) {
        originalUrl = `https://www.${url}`;
      } else if (text.includes(`https://${url}`)) {
        originalUrl = `https://${url}`;
      } else if (text.includes(`http://${url}`)) {
        originalUrl = `http://${url}`;
      } else if (text.includes(`www.${url}`)) {
        originalUrl = `www.${url}`;
      }

      if (text.includes(`${originalUrl}/`)) {
        url = `${originalUrl}/`;
        originalUrl = `${originalUrl}/`;
      }

      text = text.replace(
        url,
        withLinks
          ? `<a class="current relative hover:underline text-purple-600 dark:text-purple-400" href="${
              originalUrl.startsWith("http")
                ? originalUrl
                : `https://${originalUrl}`
            }" target="_blank">${url.length > 50 ? url.split("?")[0] : url}</a>`
          : ""
      );
    });
  }

  const fLinkPattern = /(^|\s)(f\/\w+|\/f\/\w+)/g;
  text = text.replace(fLinkPattern, (match, p1, p2) => {
    const cleanedFlink = p2.startsWith("/") ? p2.slice(1) : p2;
    const linkedFLink = `<a class="current relative hover:underline text-purple-600 dark:text-purple-400" href="${`/${cleanedFlink}`}" target="_blank">${cleanedFlink}</a>`;
    return p1 + linkedFLink;
  });

  const ethPattern = /(\b\w+\.eth\b)/g;
  text = text.replace(ethPattern, (match) => {
    if (mentions.some(({ mention }) => mention?.fname === match)) return match;
    const linkedEth = `<a class="current relative hover:underline text-purple-600 dark:text-purple-400" href="${`https://rainbow.me/${match}`}" target="_blank">${match}</a>`;
    return linkedEth;
  });

  return text.trim();
};

export const createDateRange = (start: Date, end: Date) => {
  return eachDayOfInterval({
    start: startOfDay(start),
    end: startOfDay(end),
  }).map((date) => ({
    timestamp: date.getTime(),
    followers: 0,
    engagement: 0,
  }));
};

export const mergeDataWithDateRange = (data: any[], dateRange: any[]) => {
  const dataWithDate = data.reduce((acc: any, cur: any) => {
    acc[cur.timestamp] = cur;
    return acc;
  }, {});

  return dateRange.map((date) => dataWithDate[date.timestamp] || date);
};
