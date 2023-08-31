import { SearchInput } from "@/components/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { headers } from "next/headers";

type FarcasterAccount = {
  fid: number;
  fname: string;
  display?: string;
  pfp?: string;
  bio?: string;
};

type EthereumAccount = {
  address: string;
  ensName?: string;
};

type Entity = {
  farcasterAccounts: FarcasterAccount[];
  twitterAccounts: string[];
  ethereumAccounts: EthereumAccount[];
};

const getEntity = async (id: string): Promise<Entity> => {
  const host = headers().get("host");
  const protocal = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(`${protocal}://${host}/api/${id}`);
  return await data.json();
};

const Overview = ({ entity }: { entity: Entity }) => {
  const mainIdentity = entity.farcasterAccounts[0];
  const mainTwitter = entity.twitterAccounts[0];

  return (
    <>
      <Avatar>
        <AvatarImage src={mainIdentity?.pfp} />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <div className="font-semibold text-2xl">{mainIdentity?.display}</div>
      <div className="flex flex-row text-slate-400 space-x-6">
        {mainIdentity?.fname && (
          <a
            href={`https://warpcast.com/${mainIdentity?.fname}`}
            className="flex flex-row items-center space-x-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/farcaster.png" alt="farcaster" className="w-5 h-5" />
            <span>{mainIdentity?.fname}</span>
          </a>
        )}
        {mainTwitter && (
          <a
            href={`https://twitter.com/${mainTwitter}`}
            className="flex flex-row items-center space-x-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/x.png" alt="twitter" className="w-4 h-4" />
            <span>{mainTwitter}</span>
          </a>
        )}
      </div>
      <div className="text-center">{mainIdentity?.bio}</div>
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
  <a className="flex flex-col" href={url}>
    <div className="font-semibold whitespace-normal break-words	">
      {identity}
    </div>
    <div className="text-sm text-slate-400">{platform}</div>
  </a>
);

export default async function User({ params }: { params: { id: string } }) {
  const entity = await getEntity(params.id);
  return (
    <div className="flex flex-col items-center w-full p-4">
      <div className="flex flex-col items-center w-full max-w-sm space-y-4">
        <Overview entity={entity} />
        <Card className="w-full">
          <CardHeader>Accounts</CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {entity.farcasterAccounts.map((account) => (
                <CardItem
                  key={account.fid}
                  platform="Farcaster"
                  identity={account.fname}
                  url={`https://warpcast.com/${account.fname}`}
                />
              ))}
              {entity.twitterAccounts.map((account) => (
                <CardItem
                  key={account}
                  platform="Twitter"
                  identity={account}
                  url={`https://twitter.com/${account}`}
                />
              ))}
              {entity.ethereumAccounts.map((account) => {
                const formattedAddress = `${account.address.substring(
                  0,
                  6
                )}...${account.address.substring(account.address.length - 4)}`;
                return (
                  <CardItem
                    key={account.address}
                    platform={
                      account.ensName
                        ? `Ethereum (${formattedAddress})`
                        : "Ethereum"
                    }
                    identity={account.ensName || formattedAddress}
                    url={`https://etherscan.io/address/${account.address}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
        <SearchInput />
      </div>
    </div>
  );
}
