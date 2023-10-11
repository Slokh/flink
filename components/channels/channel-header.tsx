"use client";

import { CHANNELS_BY_ID } from "@/lib/channels";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { FollowChannel } from "../actions/follow-channel";
import { useEffect, useState } from "react";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ChannelHeader = ({ channelId }: { channelId: string }) => {
  const [active, setActive] = useState(0);
  const channel = CHANNELS_BY_ID[channelId] || {
    name: decodeURIComponent(channelId),
    channelId: channelId,
    parentUrl: decodeURIComponent(channelId),
  };
  const isUnknownChannel = !CHANNELS_BY_ID[channelId];

  useEffect(() => {
    const handle = async () => {
      const res = await fetch(
        `/api/stats/channels/${encodeURIComponent(channel.parentUrl)}/active`
      );
      const { active } = await res.json();
      setActive(active);
    };
    handle();
  }, []);

  return (
    <div className="flex flex-row items-center justify-between p-4">
      <div className="flex flex-row items-center space-x-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={channel.image} className="object-cover" />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-semibold text-xl">
            {isUnknownChannel ? "Unknown" : channel.name}
          </div>
          {active > 0 && (
            <div className="flex flex-row text-sm items-center space-x-1">
              <svg
                className="animate-pulse h-2 w-2 text-green-500"
                viewBox="0 0 24 24"
              >
                <circle
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="currentColor"
                  cx="12"
                  cy="12"
                  r="10"
                />
              </svg>
              <div>{`${active} users online`}</div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <QuestionMarkCircledIcon className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Users who casted or reacted in the last 5 minutes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {/* <div className="text-muted-foreground text-xs hidden lg:flex">
            {channel.parentUrl}
          </div> */}
        </div>
      </div>
      <FollowChannel />
    </div>
  );
};
