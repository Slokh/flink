"use client";

import { FarcasterCastTree } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { formatText } from "@/lib/utils";
import { LikeCast } from "../actions/like-cast";
import { RecastCast } from "../actions/recast-cast";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceStrict } from "date-fns";
import { EmbedPreview } from "../embeds";
import { ReplyCastButton } from "../actions/new-cast";
import { DeleteCast } from "../actions/delete-cast";
import { CopyLink } from "../copy-link";
import { useState } from "react";
import { PlusIcon } from "@radix-ui/react-icons";

export const CollapsibleCast = ({
  cast,
  isHighlighted,
}: {
  cast: FarcasterCastTree;
  isHighlighted?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const formattedText = formatText(cast.text, cast.mentions, cast.embeds, true);

  const user = cast.user || {
    fname: "unknown",
    pfp: "",
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={() => setOpen(!open)}
      className="flex flex-row pr-16"
    >
      <div className="flex flex-col items-center">
        {open && (
          <div className="flex flex-col items-end justify-start text-sm cursor-pointer">
            <LikeCast hash={cast.hash} likes={cast.likes} mode="icons" />
            <RecastCast hash={cast.hash} recasts={cast.recasts} mode="icons" />
          </div>
        )}
        <div className="h-full pt-2">
          <CollapsibleTrigger asChild>
            {open ? (
              <div className="cursor-pointer transition-all h-full px-4 group">
                <Separator
                  orientation="vertical"
                  className="group-hover:bg-muted-foreground transition-all duration-250"
                />
              </div>
            ) : (
              <div className="flex flex-row space-x-2 items-center cursor-pointer text-sm whitespace-nowrap group">
                <div className="p-1 rounded-full group-hover:bg-border transition-all duration-250">
                  <PlusIcon />
                </div>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.pfp} className="object-cover" />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="flex flex-row space-x-1 cursor-pointer">
                  <div className="font-semibold">
                    {user.display || user.fname}
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">{`@${user.fname}`}</div>
                </div>
                <div className="text-zinc-500">
                  {formatDistanceStrict(new Date(cast.timestamp), new Date(), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            )}
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className="flex flex-col w-full px-2 mb-1 min-w-full">
        <div
          className={`flex flex-row space-x-2 w-full ${
            isHighlighted
              ? "border-black dark:border-white p-2 border rounded-lg"
              : ""
          }`}
        >
          <div className="flex flex-col pt-1 w-full">
            <div className="flex flex-row space-x-2 text-sm">
              <Link href={`/${user.fname}`}>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.pfp} className="object-cover" />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
              </Link>
              <Link
                href={`/${user.fname}`}
                className="flex flex-row space-x-1 cursor-pointer"
              >
                <div className="font-semibold">
                  {user.display || user.fname}
                </div>
                <div className="text-purple-600 dark:text-purple-400 hover:underline">{`@${user.fname}`}</div>
              </Link>
              <div className="text-zinc-500">
                {formatDistanceStrict(new Date(cast.timestamp), new Date(), {
                  addSuffix: true,
                })}
              </div>
            </div>
            <div className="max-w-2xl flex flex-col whitespace-pre-wrap break-words text-md leading-6 tracking-normal w-full space-y-2 pt-2">
              <div dangerouslySetInnerHTML={{ __html: formattedText }} />
              {cast.embeds.length > 0 && (
                <div className="flex flex-col space-y-2">
                  {cast.embeds.map((embed, i) => (
                    <EmbedPreview key={i} embed={embed} />
                  ))}
                </div>
              )}
            </div>
            <div className="text-zinc-500 text-sm flex flex-row space-x-4">
              <ReplyCastButton parent={cast} />
              <a
                href={`https://warpcast.com/${user.fname}/${cast.hash.slice(
                  0,
                  8
                )}`}
                target="_blank"
                className="hover:underline"
              >
                warpcast
              </a>
              <CopyLink link={`https://flink.fyi/${user.fname}/${cast.hash}`} />
              <DeleteCast hash={cast.hash} isReply>
                <div className="hover:underline">delete</div>
              </DeleteCast>
            </div>
          </div>
        </div>
        {cast.children.length > 0 && (
          <div className="flex flex-col mt-4">
            {cast.children.map((child) => (
              <CollapsibleCast key={child.hash} cast={child} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
