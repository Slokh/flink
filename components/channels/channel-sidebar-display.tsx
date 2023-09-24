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
import Link from "next/link";
import { ChannelSelect } from "./channel-select";

export const ChannelSidebarDisplay = ({
  channels,
}: {
  channels: ChannelStats[];
}) => {
  return (
    <div className="flex flex-col w-80 max-w-full h-full">
      <div className="flex flex-row items-center justify-between text-sm p-2">
        <div className="font-semibold">
          Trending Channels{" "}
          <span className="text-xs text-zinc-500">(last 6h)</span>
        </div>
        <ChannelSelect />
      </div>
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
                            <div className="text-zinc-500 text-sm">Unknown</div>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div>
                            This is a new channel and has not been registered on
                            flink yet.
                          </div>
                          <div>
                            <b>Channel URL: </b>
                            {channel.channel.parentUrl}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <a
                      href={`/channels/${channel.channel.channelId}`}
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
                    </a>
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
  );
};
