import { SearchInput } from "@/components/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { headers } from "next/headers";

type Farcaster = {
  fid: number;
  fname: string;
  display?: string;
  pfp?: string;
  bio?: string;
};

type OpenSea = {
  username: string;
  pfp?: string;
};

type Address = {
  address: string;
  ensName?: string;
};

type Lens = {
  username: string;
  bio?: string;
  address: string;
  display?: string;
  metadata?: string;
};

type Entity = {
  accounts: {
    farcaster?: Farcaster;
    opensea?: OpenSea[];
    lensProfiles?: Lens[];
  };
  addresses?: Address[];
  websites?: string[];
  socials: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    github?: string;
    reddit?: string;
  };
};

const getEntity = async (id: string): Promise<Entity> => {
  const host = headers().get("host");
  const protocal = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(`${protocal}://${host}/api/${id}`);
  return await data.json();
};

const Overview = ({ entity }: { entity: Entity }) => {
  const farcaster = entity.accounts.farcaster;
  const twitter = entity.socials.twitter;
  const lensProfiles = entity.accounts.lensProfiles;

  const displayName =
    farcaster?.display ||
    farcaster?.fname ||
    lensProfiles?.find((a) => a.display)?.display;
  const pfp =
    farcaster?.pfp || entity.accounts.opensea?.find((a) => a.pfp)?.pfp;

  return (
    <>
      <Avatar>
        <AvatarImage src={pfp} className="object-cover" />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <div className="font-semibold text-2xl">{displayName}</div>
      <div className="flex flex-row text-slate-400 space-x-6">
        {farcaster?.fname && (
          <a
            href={`https://warpcast.com/${farcaster.fname}`}
            className="flex flex-row items-center space-x-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/farcaster.png" alt="farcaster" className="w-5 h-5" />
            <span>{farcaster.fname}</span>
          </a>
        )}
        {twitter && (
          <a
            href={`https://twitter.com/${twitter}`}
            className="flex flex-row items-center space-x-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/x.png" alt="twitter" className="w-4 h-4" />
            <span>{twitter}</span>
          </a>
        )}
      </div>
      <div className="text-center">
        {farcaster?.bio || lensProfiles?.find((a) => a.bio)?.bio}
      </div>
    </>
  );
};

const CardItem = ({
  platform,
  identity,
  url,
}: {
  platform: string;
  identity: string;
  url: string;
}) => (
  <a className="flex flex-col" href={url} target="_blank">
    <div className="font-semibold whitespace-normal break-words	">
      {identity}
    </div>
    <div className="text-sm text-slate-400">{platform}</div>
  </a>
);

export default async function User({ params }: { params: { id: string } }) {
  const entity = await getEntity(params.id);
  const {
    accounts: { farcaster, opensea, lensProfiles },
    addresses,
    websites,
    socials,
  } = entity;

  const { twitter, discord, telegram, github, reddit } = socials;

  return (
    <div className="flex flex-col items-center w-full p-4">
      <div className="flex flex-col items-center w-full max-w-sm space-y-4">
        <Overview entity={entity} />
        <Card className="w-full">
          <CardHeader>Links</CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {farcaster && (
                <CardItem
                  key={farcaster.fid}
                  platform="Farcaster"
                  identity={farcaster.fname}
                  url={`https://warpcast.com/${farcaster.fname}`}
                />
              )}
              {twitter && (
                <CardItem
                  key={twitter}
                  platform="Twitter"
                  identity={twitter}
                  url={`https://twitter.com/${twitter}`}
                />
              )}
              {opensea?.map((account) => (
                <CardItem
                  key={account.username}
                  platform="OpenSea"
                  identity={account.username}
                  url={`https://opensea.io/${account.username}`}
                />
              ))}
              {discord && (
                <CardItem
                  key={discord}
                  platform="Discord"
                  identity={discord}
                  url={`https://discord.com/${discord}`}
                />
              )}
              {telegram && (
                <CardItem
                  key={telegram}
                  platform="Telegram"
                  identity={telegram}
                  url={`https://telegram.org/${telegram}`}
                />
              )}
              {github && (
                <CardItem
                  key={github}
                  platform="GitHub"
                  identity={github}
                  url={`https://github.com/${github}`}
                />
              )}
              {reddit && (
                <CardItem
                  key={reddit}
                  platform="Reddit"
                  identity={reddit}
                  url={`https://reddit.com/u/${reddit}`}
                />
              )}
              {addresses?.map(({ address, ensName }) => {
                const formattedAddress = `${address.substring(
                  0,
                  6
                )}...${address.substring(address.length - 4)}`;
                return (
                  <CardItem
                    key={address}
                    platform={
                      ensName ? `Ethereum (${formattedAddress})` : "Ethereum"
                    }
                    identity={ensName || formattedAddress}
                    url={`https://etherscan.io/address/${address}`}
                  />
                );
              })}
              {websites?.map((website) => (
                <CardItem
                  key={website}
                  platform="Website"
                  identity={website}
                  url={website}
                />
              ))}
              {lensProfiles?.map((lensProfile) => (
                <CardItem
                  key={lensProfile.username}
                  platform="Lens"
                  identity={lensProfile.username}
                  url={`https://buttrfly.app/profile/${lensProfile.username}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <SearchInput />
      </div>
    </div>
  );
}
