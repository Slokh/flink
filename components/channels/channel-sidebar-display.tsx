"use client";

import { ScrollArea } from "../ui/scroll-area";
import {
  DashIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from "@radix-ui/react-icons";
import { ChannelStats } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ChannelSelect } from "./channel-select";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Button } from "../ui/button";
import { useState } from "react";

export const ChannelSidebarDisplay = ({
  channels,
}: {
  channels: ChannelStats[];
}) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(
    JSON.parse(localStorage.getItem("sidebarOpen") || "true")
  );

  const handleOpenChange = () => {
    localStorage.setItem("sidebarOpen", JSON.stringify(!open));
    setOpen(!open);
  };

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <div className="flex flex-row items-center border-b">
        {open && (
          <div className="flex flex-row items-center w-full justify-between text-sm p-2 whitespace-nowrap">
            <div className="font-semibold">
              Trending Channels{" "}
              <span className="text-xs text-zinc-500">(last 6h)</span>
            </div>
            <ChannelSelect
              suffix={
                /channels\/.*\/stats/.test(pathname)
                  ? `/stats${pathname.endsWith("users") ? "/users" : ""}`
                  : ""
              }
            />
          </div>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-2 rounded-none w-12 h-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                    />
                  </svg>
                </Button>
              </CollapsibleTrigger>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Trending channels</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <CollapsibleContent style={{ height: "calc(100vh - 87px)" }}>
        <div className="flex flex-col w-80 max-w-full h-full">
          <ScrollArea className="h-full">
            {channels
              .filter(({ posts, replies }) => posts + replies > 0)
              .map((channel, i) => {
                const isUnknown =
                  channel.channel.name === channel.channel.parentUrl &&
                  channel.channel.channelId === channel.channel.parentUrl;
                const delta = channel.rankDeltas.engagement;
                return (
                  <div
                    key={channel.channel.channelId}
                    className="flex flex-row items-center justify-between border-b p-2 pr-4"
                  >
                    <div className="flex flex-row items-center">
                      <div className="flex flex-col items-center w-10 text-xs">
                        <div>{i + 1}</div>
                        <div className="flex flex-row items-center text-zinc-500">
                          {delta > 0 ? (
                            <TriangleUpIcon className="text-green-500" />
                          ) : delta < 0 ? (
                            <TriangleDownIcon className="text-red-500" />
                          ) : (
                            <DashIcon className="ext-zinc-500" />
                          )}
                          <div>
                            {delta > 0
                              ? delta
                              : delta < 0
                              ? delta.toString().substring(1)
                              : ""}
                          </div>
                        </div>
                      </div>
                      {isUnknown ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <a
                                href={`/channels/${encodeURIComponent(
                                  channel.channel.channelId
                                )}`}
                                className="flex flex-row space-x-2 items-center transition cursor-pointer p-1"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={channel.channel.image}
                                    className="object-cover"
                                  />
                                  <AvatarFallback>?</AvatarFallback>
                                </Avatar>
                                <div className="text-zinc-500 text-sm">
                                  Unknown
                                </div>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>
                                This is a new channel and has not been
                                registered on flink yet.
                              </div>
                              <div>
                                <b>Channel URL: </b>
                                {channel.channel.parentUrl}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Link
                          href={`/channels/${channel.channel.channelId}${
                            /channels\/.*\/stats/.test(pathname)
                              ? `/stats${
                                  pathname.endsWith("users") ? "/users" : ""
                                }`
                              : ""
                          }`}
                          className="flex flex-row space-x-2 items-center hover:text-purple-600 hover:dark:text-purple-400 transition p-1"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={channel.channel.image}
                              className="object-cover"
                            />
                            <AvatarFallback>?</AvatarFallback>
                          </Avatar>
                          <div className="font-semibold text-sm">
                            {channel.channel.name}
                          </div>
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-x-1 text-xs">
                      <div className="flex flex-row space-x-1">
                        <div className="text-zinc-500">Posts:</div>
                        <div>{channel.posts}</div>
                      </div>
                      <div className="flex flex-row space-x-1">
                        <div className="text-zinc-500">Replies:</div>
                        <div>{channel.replies}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
