import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { headers } from "next/headers";

const getUserData = async (username: string) => {
  const host = headers().get("host");
  const protocal = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(`${protocal}://${host}/api/user/${username}`);
  return await data.json();
};

export default async function User({
  params,
}: {
  params: { username: string };
}) {
  const data = await getUserData(params.username);
  return (
    <div className="min-h-screen flex flex-col items-center w-full p-4 space-y-4">
      <Avatar>
        <AvatarImage src={data?.pfp} />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <div className="font-semibold text-2xl">{data?.display}</div>
      <div className="flex flex-row text-slate-400 space-x-6">
        {data?.fname && (
          <a
            href={`https://warpcast.com/${data?.fname}`}
            className="flex flex-row items-center space-x-1"
          >
            <img src="/farcaster.png" alt="farcaster" className="w-5 h-5" />
            <span>{data?.fname}</span>
          </a>
        )}
        {data?.twitterUsername && (
          <a
            href={`https://twitter.com/${data?.twitterUsername}`}
            className="flex flex-row items-center space-x-1"
          >
            <img src="/x.png" alt="twitter" className="w-4 h-4" />
            <span>{data?.twitterUsername}</span>
          </a>
        )}
      </div>
      <div className="text-center">{data?.bio}</div>
      <Card className="w-64">
        <CardHeader>Identities</CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {data?.fname && (
              <a
                className="flex flex-col"
                href={`https://warpcast.com/${data?.fname}`}
              >
                <div className="font-semibold">{data?.fname}</div>
                <div className="text-sm text-slate-400">Farcaster</div>
              </a>
            )}
            {data?.twitterUsername && (
              <a
                className="flex flex-col"
                href={`https://twitter.com/${data?.twitterUsername}`}
              >
                <div className="font-semibold">{data?.twitterUsername}</div>
                <div className="text-sm text-slate-400">Twitter</div>
              </a>
            )}
            {data?.addresses?.map((address: string) => (
              <a
                className="flex flex-col"
                key={address}
                href={`https://etherscan.io/address/${address}`}
              >
                <div className="font-semibold">{`${address.substring(
                  0,
                  6
                )}...${address.substring(address.length - 4)}`}</div>
                <div className="text-sm text-slate-400">Ethereum</div>
              </a>
            ))}
            {data?.ensNames?.map((ensName: string) => (
              <a
                className="flex flex-col"
                key={ensName}
                href={`https://etherscan.io/name-lookup-search?id=${ensName}`}
              >
                <div className="font-semibold">{ensName}</div>
                <div className="text-sm text-slate-400">Ethereum</div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
