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
  fname?: string;
  fid?: number;
  pfp?: EntityText;
  bio?: EntityText;
  display?: EntityText;
  accounts: Account[];
  ethereum: Ethereum[];
  relatedLinks: Link[];
  emails: Link[];
  followers?: number;
  following?: number;
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
  embeds: Embed[];
  likes: number;
  recasts: number;
  replies: number;
};

export type FarcasterCastTree = FarcasterCast & {
  children: FarcasterCastTree[];
};

export type Embed = {
  url: string;
  urlHost: string;
  contentType: string;
  contentMetadata?: NftMetadata | Metadata | {};
  parsed: boolean;
};

export type NftMetadata = {
  name: string;
  description: string;
  image_url: string;
  externalUrl: string;
};

export enum CastsSort {
  Hot = "Hot",
  New = "New",
  Top = "Top",
  NewReplies = "New Replies",
  TopReplies = "Top Replies",
}

export type Channel = {
  name: string;
  parentUrl: string;
  image: string;
  channelId: string;
};

export type CastsQuery = {
  params: { id: string; channel: string };
  searchParams: { time?: string; page?: string };
};
