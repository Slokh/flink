import { Navbar } from "@/components/navbar";
import { SearchInput } from "@/components/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Account, Entity, Ethereum, RelatedLink } from "@/lib/types";
import { Metadata } from "next";
import { headers } from "next/headers";

const getEntity = async (id: string): Promise<Entity> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(`${protocol}://${host}/api/${id}`);
  return await data.json();
};

export const generateMetadata = async ({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> => {
  const { pfps, displays, bios } = await getEntity(params.id);
  const pfp = pfps[0];
  const display = displays[0];
  const bio = bios[0];

  return {
    title: display.value || params.id,
    description:
      bio.value || `Check out ${display.value || params.id}'s unified profile`,
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://flink.vercel.app/${params.id}`,
      title: display.value || params.id,
      description:
        bio.value ||
        `Check out ${display.value || params.id}'s unified profile`,
      images: [
        {
          url: pfp?.value || "/favicon.ico",
          width: 1200,
          height: 630,
          alt: "flink",
        },
      ],
      siteName: "flink",
    },
  };
};

const Overview = ({
  id,
  entity: { pfps, displays, bios },
}: {
  id: string;
  entity: Entity;
}) => {
  const pfp = pfps[0];
  const display = displays[0];
  const bio = bios[0];

  return (
    <>
      <Avatar>
        <AvatarImage src={pfp?.value} className="object-cover" />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <div className="font-semibold text-2xl  text-center">
        {display?.value || id}
      </div>
      <div className="text-center">{bio?.value}</div>
    </>
  );
};

const CardItem = ({
  platform,
  identity,
  url,
  verified,
  image,
}: {
  platform: string;
  identity: string;
  url: string;
  verified: boolean;
  image?: string;
}) => (
  <a href={url} target="_blank">
    <div className="flex flex-row items-center space-x-2 w-full">
      <div className="w-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image || `/${platform.toLowerCase()}.png`}
          alt="farcaster"
          className="max-w-7 max-h-7"
        />
      </div>
      <div className="flex flex-col w-64">
        <div className="font-semibold whitespace-normal break-words	">
          {identity}
        </div>
        <div className="text-sm text-slate-400 flex flex-row items-center space-x-1">
          <span>{platform}</span>
          {verified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="bg-green-400 rounded-full">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                        fill="black"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verified</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  </a>
);

const Accounts = ({ accounts }: { accounts: Account[] }) => {
  return (
    <Card className="w-full">
      <CardHeader>Accounts</CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {accounts?.map(({ platform, username, link, verified }) => (
            <CardItem
              key={username}
              platform={platform}
              identity={username}
              url={`https://${link}`}
              verified={verified}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const Addresses = ({ ethereum }: { ethereum: Ethereum[] }) => (
  <Card className="w-full">
    <CardHeader>Addresses</CardHeader>
    <CardContent>
      <div className="flex flex-col space-y-4">
        {ethereum?.map(({ address, ensName, verified }) => {
          const formattedAddress = `${address.substring(
            0,
            6
          )}...${address.substring(address.length - 4)}`;
          return (
            <CardItem
              key={address}
              platform={ensName ? `Ethereum (${formattedAddress})` : "Ethereum"}
              identity={ensName || formattedAddress}
              url={`https://etherscan.io/address/${address}`}
              verified={verified}
              image="/ethereum.png"
            />
          );
        })}
      </div>
    </CardContent>
  </Card>
);

const RelatedLinks = ({ relatedLinks }: { relatedLinks: RelatedLink[] }) => (
  <Card className="w-full">
    <CardHeader>Related Links</CardHeader>
    <CardContent>
      <div className="flex flex-col space-y-4">
        {relatedLinks?.map(({ link, verified }) => (
          <CardItem
            key={link}
            platform="Website"
            identity={link.replace(/(^\w+:|^)\/\//, "")}
            url={`https://${link}`}
            verified={verified}
          />
        ))}
      </div>
    </CardContent>
  </Card>
);

export default async function User({ params }: { params: { id: string } }) {
  const entity = await getEntity(params.id);
  const { accounts, ethereum, relatedLinks } = entity;

  return (
    <>
      <div className="flex flex-col items-center w-full p-4 min-h-screen mt-4">
        <div className="flex flex-col items-center w-full max-w-sm space-y-4">
          <Overview id={params.id} entity={entity} />
          {accounts?.length > 0 && <Accounts accounts={accounts} />}
          {ethereum?.length > 0 && <Addresses ethereum={ethereum} />}
          {relatedLinks?.length > 0 && (
            <RelatedLinks relatedLinks={relatedLinks} />
          )}
          <SearchInput />
        </div>
      </div>
      <Navbar variant="bottom" />
    </>
  );
}
