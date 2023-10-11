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
  bio?: string;
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

export type CastMetadata = {
  user: FarcasterUser;
  cast: FarcasterCast;
};

export type Embed = {
  url: string;
  urlHost: string;
  contentType: string;
  contentMetadata?: NftMetadata | Metadata | CastMetadata | {};
  parsed: boolean;
};

export type NftMetadata = {
  name: string;
  description: string;
  image_url: string;
  externalUrl: string;
};

export enum CastsSort {
  Home = "Home",
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
  params: { id: string; channel: string; url?: string[]; query?: string };
  searchParams: {
    time?: string;
    page?: string;
    display?: string;
  };
};

type AuthenticatedUserPreferences = {
  channels: string[];
};

export type AuthenticatedUser = {
  fid: number;
  fname?: string;
  pfp?: string;
  display?: string;
  bio?: string;
  requiresSigner?: boolean;
  likes: { [key: string]: boolean };
  recasts: { [key: string]: boolean };
  casts: { [key: string]: boolean };
  follows: { [key: string]: boolean };
  preferences: AuthenticatedUserPreferences;
};

export type ChannelStatsEntries = {
  likes: number;
  recasts: number;
  replies: number;
  posts: number;
  engagement: number;
};

export type UserStatsEntries = ChannelStatsEntries & {
  liked: number;
  recasted: number;
  mentions: number;
};

export type ChannelStats = ChannelStatsEntries & {
  url: string;
  channel: Channel;
  previous?: ChannelStatsEntries;
  rankDeltas: ChannelStatsEntries;
};

export type LinkStats = ChannelStatsEntries & {
  url: string;
  contentMetadata?: Metadata;
  previous?: ChannelStatsEntries;
  rankDeltas: ChannelStatsEntries;
};

export type DailyChannelStats = ChannelStatsEntries & {
  timestamp: string;
};

export type ChannelUserStats = UserStatsEntries & {
  user: FarcasterUser;
};

export type DailyUserStats = UserStatsEntries & {
  timestamp: string;
};

export type UserChannelStats = UserStatsEntries & {
  channel: Channel;
};

export type UserStats = UserStatsEntries & {
  user: FarcasterUser;
  previous?: UserStatsEntries;
  rankDeltas: UserStatsEntries;
};

export enum DisplayMode {
  Default = "default",
  Links = "links",
  Images = "images",
}

export type TransferRequest = {
  to: `0x${string}`;
  fid: number;
  signature: `0x${string}`;
  deadline: number;
  fname: string;
};

export type ChannelMember = {
  collection: {
    name: string;
    quantity: number;
  };
  token: {
    contractAddress: string;
    tokenId: string;
    ownerAddress: string;
    quantity: number;
    firstAcquiredAt: string;
    metadata: {
      name: string;
      description?: string;
      image?: string;
      openseaUrl?: string;
    };
  };
  user: FarcasterUser;
  followers: number;
  recentActivity: UserStatsEntries;
  allActivity: UserStatsEntries;
};

export type Notification = {
  type: "like" | "recast" | "follow" | "reply" | "mention";
  timestamp: Date;
  user: FarcasterUser;
  viewed: boolean;
  data?: FarcasterCast;
};
