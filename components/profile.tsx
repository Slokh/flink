/* eslint-disable @next/next/no-img-element */
import { Entity } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { FollowUser } from "./actions/follow-user";

export const Profile = ({ entity, id }: { entity: Entity; id: string }) => (
  <div className="flex flex-col md:flex-row justify-between p-4 w-full">
    <div className="flex flex-col">
      <div className="flex flex-row space-x-4 items-start">
        <Avatar className="w-12 h-12">
          <AvatarImage src={entity.pfp?.value} className="object-cover" />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="text-lg md:text-2xl font-semibold leading-tight">
            {entity.display?.value || id}
          </div>
          {entity.fname && (
            <div className="text-zinc-500">{`@${entity.fname}`}</div>
          )}
        </div>
        {entity.fid && <FollowUser fid={entity.fid} />}
      </div>
      {entity.bio && (
        <div className="py-2 text-sm md:text-md">{entity.bio.value}</div>
      )}
      {entity.following !== undefined && entity.followers !== undefined && (
        <div className="flex flex-col">
          <div className="flex flex-row space-x-2">
            <div className="flex flex-row space-x-1 items-center">
              <span className="font-semibold">
                {entity.following > 9999
                  ? `${Math.floor(entity.following / 1000)}k`
                  : entity.following.toLocaleString("en-US")}
              </span>
              <span className="text-sm text-zinc-500">following</span>
            </div>
            <div className="flex flex-row space-x-1 items-center">
              <span className="font-semibold">
                {entity.followers > 9999
                  ? `${Math.floor(entity.followers / 1000)}k`
                  : entity.followers.toLocaleString("en-US")}
              </span>
              <span className="text-sm text-zinc-500">followers</span>
            </div>
          </div>
        </div>
      )}
    </div>
    <div className="flex flex-row md:flex-col justify-between items-center md:items-end mt-2 md:mt-0">
      <div className="flex flex-row overflow-x-scroll">
        {entity.accounts?.map((account) => (
          <div key={account.link}>
            <a
              href={`https://${account.link}`}
              target="_blank"
              className="w-8 h-8 p-2 m-1 border rounded-md hover:bg-zinc-200 hover:dark:bg-zinc-800 transition text-center items-center justify-center flex"
            >
              <img
                src={`/${account.platform.toLowerCase()}.png`}
                alt={account.platform}
              />
            </a>
          </div>
        ))}
        {entity.ethereum?.map(({ address }) => {
          return (
            <div key={address}>
              <a
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                className="w-8 h-8 p-2 m-1 border rounded-md hover:bg-zinc-200 hover:dark:bg-zinc-800 transition text-center items-center justify-center flex"
              >
                <img
                  src="/ethereum.png"
                  alt="ethereum"
                  className="max-w-4 max-h-4"
                />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
