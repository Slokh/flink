import { type ClassValue, clsx } from "clsx";
import { SiweMessage } from "siwe";
import { twMerge } from "tailwind-merge";
import { Embed, FarcasterMention } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  embeds: Embed[],
  withLinks: boolean
) => {
  let offset = 0;
  let updatedMentionsPositions = []; // Array to store updated positions

  // Convert text to a Buffer object to deal with bytes
  let textBuffer = Buffer.from(text, "utf-8");

  for (let i = 0; i < mentions.length; i++) {
    if (!mentions[i].mention) continue;
    // Assuming mentionsPositions consider newlines as bytes, so no newline adjustment
    const adjustedMentionPosition = mentions[i].position;
    const mentionUsername = mentions[i].mention.fname;

    const mentionLink = withLinks
      ? `<a href="/${mentionUsername}" class="current relative hover:underline text-purple-600 dark:text-purple-400">@${mentionUsername}</a>`
      : `<span class="current relative text-purple-600 dark:text-purple-400">@${mentionUsername}</span>`;
    const mentionLinkBuffer = Buffer.from(mentionLink, "utf-8");

    // Apply the offset only when slicing the text
    const actualPosition = adjustedMentionPosition + offset;

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
  if (withLinks) {
    text = text.replace(
      /(https?:\/\/[^\s]+)/g,
      `<a class="current relative hover:underline text-purple-600 dark:text-purple-400" href="$1" target="_blank">$1</a>`
    );

    // Then, handle the specific URLs
    const urls = embeds
      .map(({ url }) => normalizeLink(url))
      .filter((url, index, self) => self.indexOf(url) === index);

    urls.forEach((url) => {
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
        originalUrl = `${originalUrl}/`;
      }

      const urlRegex = new RegExp(`(?<!href=")${originalUrl}`, "g");

      if (url.includes("warpcast.com") && url.match(/0x[0-9a-fA-F]+$/i)) {
        text = text.replace(urlRegex, "");
        return;
      }

      text = text.replace(
        urlRegex,
        `<a class="current relative hover:underline text-purple-600 dark:text-purple-400" href="${
          originalUrl.startsWith("http")
            ? originalUrl
            : `https://${originalUrl}`
        }" target="_blank">${url}</a>`
      );
    });
  } else {
    embeds.forEach(({ url }) => {
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
        originalUrl = `${originalUrl}/`;
      }
      text = text.replace(originalUrl, "");
    });

    text = text.replace(/(https?:\/\/[^\s]+)/g, "");
  }

  return text;
};

const normalizeLink = (link: string): string => {
  let normalized = link.trim();
  if (normalized.includes(" ")) {
    normalized = normalized.split(" ")[0];
  }

  const startsWiths = ["http://", "https://", "www."];
  const endsWiths = ["/"];
  for (const startsWith of startsWiths) {
    if (normalized.startsWith(startsWith)) {
      normalized = normalized.replace(startsWith, "");
    }
  }
  for (const endsWith of endsWiths) {
    if (normalized.endsWith(endsWith)) {
      normalized = normalized.slice(0, -endsWith.length);
    }
  }

  return normalized;
};
