import { type ClassValue, clsx } from "clsx";
import { SiweMessage } from "siwe";
import { twMerge } from "tailwind-merge";

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
