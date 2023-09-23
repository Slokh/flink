import { Account, Entity, EntityText, Ethereum, Link } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { ScrollArea } from "./scroll-area";
import { FollowUser } from "../actions/follow-user";

const GroupItem = ({
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
    <div className="flex flex-row items-center space-x-2">
      <div className="w-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image || `/${platform.toLowerCase()}.png`}
          alt="farcaster"
          className="max-w-7 max-h-7"
        />
      </div>
      <div className="flex flex-col">
        <div className="font-semibold truncate text-sm w-52">{identity}</div>
        <div className="text-sm text-slate-400 flex flex-row space-x-1 items-center text-sm">
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

const Group = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="p-2">
    <div className="font-semibold text-sm">{title}</div>
    <div className="flex flex-col space-y-2 mt-2">{children}</div>
  </div>
);

export const ProfileOverview = ({
  id,
  entity: { fid, pfp, bio, display, followers, following },
}: {
  id: string;
  entity: Entity;
}) => (
  <div className="flex flex-col items-center space-y-2 p-4">
    <Avatar>
      <AvatarImage src={pfp?.value} className="object-cover" />
      <AvatarFallback>?</AvatarFallback>
    </Avatar>
    <div className="font-semibold text-2xl text-center">
      {display?.value || id}
    </div>
    {following !== undefined && followers !== undefined && (
      <div className="flex flex-col items-center">
        <div className="flex flex-row space-x-2">
          <div className="flex flex-row space-x-1 items-center">
            <span className="font-semibold">
              {following > 9999
                ? `${Math.floor(following / 1000)}k`
                : following.toLocaleString("en-US")}
            </span>
            <span className="text-sm text-zinc-500">following</span>
          </div>
          <div className="flex flex-row space-x-1 items-center">
            <span className="font-semibold">
              {followers > 9999
                ? `${Math.floor(followers / 1000)}k`
                : followers.toLocaleString("en-US")}
            </span>
            <span className="text-sm text-zinc-500">followers</span>
          </div>
        </div>
        {fid && <FollowUser fid={fid} />}
      </div>
    )}
    <div className="text-center">{bio?.value}</div>
  </div>
);

const Accounts = ({ accounts }: { accounts: Account[] }) => (
  <Group title="Accounts">
    {accounts?.map(({ platform, username, link, verified }) => (
      <GroupItem
        key={username}
        platform={platform}
        identity={username}
        url={`https://${link}`}
        verified={verified}
      />
    ))}
  </Group>
);

const Addresses = ({ ethereum }: { ethereum: Ethereum[] }) => (
  <Group title="Addresses">
    {ethereum?.map(({ address, ensName, verified }) => {
      const formattedAddress = `${address.substring(0, 6)}...`;
      return (
        <GroupItem
          key={address}
          platform={ensName ? `Ethereum (${formattedAddress})` : "Ethereum"}
          identity={ensName || formattedAddress}
          url={`https://etherscan.io/address/${address}`}
          verified={verified}
          image="/ethereum.png"
        />
      );
    })}
  </Group>
);

const RelatedLinks = ({ relatedLinks }: { relatedLinks: Link[] }) => (
  <Group title="Related Links">
    {relatedLinks?.map(({ link, verified }) => (
      <GroupItem
        key={link}
        platform="Website"
        identity={link.replace(/(^\w+:|^)\/\//, "")}
        url={`https://${link}`}
        verified={verified}
      />
    ))}
  </Group>
);

const Emails = ({ emails }: { emails: Link[] }) => (
  <Group title="Emails">
    {emails?.map(({ link, verified }) => (
      <GroupItem
        key={link}
        platform="Website"
        identity={link.replace(/(^\w+:|^)\/\//, "")}
        url={`mailto:${link}`}
        verified={verified}
      />
    ))}
  </Group>
);

export const ProfileIdentity = ({
  entity: { accounts, ethereum, relatedLinks, emails },
}: {
  entity: Entity;
}) => (
  <>
    {accounts?.length > 0 && <Accounts accounts={accounts} />}
    {ethereum?.length > 0 && <Addresses ethereum={ethereum} />}
    {relatedLinks?.length > 0 && <RelatedLinks relatedLinks={relatedLinks} />}
    {emails?.length > 0 && <Emails emails={emails} />}
  </>
);

export const Profile = ({ entity, id }: { entity: Entity; id: string }) => (
  <div className="flex flex-col items-center p-2 w-80 max-w-full h-full">
    <ScrollArea className="h-full">
      <ProfileOverview id={id} entity={entity} />
      <ProfileIdentity entity={entity} />
    </ScrollArea>
  </div>
);
