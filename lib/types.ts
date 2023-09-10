import { Metadata } from "unfurl.js/dist/types";

export type EntityText = {
  value: string;
  platform: string;
};

export type Ethereum = {
  chain: string;
  address: string;
  ensName?: string;
  verified: boolean;
};

export type Account = {
  platform: string;
  username: string;
  link: string;
  verified: boolean;
};

export type Link = {
  link: string;
  verified: boolean;
};

export type Entity = {
  fid?: number;
  pfp?: EntityText;
  bio?: EntityText;
  display?: EntityText;
  accounts: Account[];
  ethereum: Ethereum[];
  relatedLinks: Link[];
  emails: Link[];
};

export type FarcasterUser = {
  fid: number;
  fname?: string;
  pfp?: string;
  display?: string;
};

export type FarcasterMention = {
  mention: FarcasterUser;
  position: number;
};

export type FarcasterCast = {
  user: FarcasterUser;
  hash: string;
  timestamp: string;
  parentCast?: FarcasterCast;
  parentUrl?: string;
  topParentCast?: FarcasterCast;
  topParentUrl?: string;
  text: string;
  mentions: FarcasterMention[];
  urlEmbeds: string[];
  castEmbeds: FarcasterCast[];
  embeds: Embed[];
  likes: number;
  recasts: number;
};

export type Embed = {
  url: string;
  type: "nft" | "media" | "url";
  nftMetadata?: NftMetadata;
  urlMetadata?: Metadata;
};

export type NftMetadata = {
  name: string;
  description: string;
  image: string;
  externalUrl: string;
};
