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
  pfps: EntityText[];
  displays: EntityText[];
  bios: EntityText[];
  accounts: Account[];
  ethereum: Ethereum[];
  relatedLinks: Link[];
  emails: Link[];
};
