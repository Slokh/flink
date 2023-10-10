"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/user";
import {
  ChatBubbleIcon,
  HeartFilledIcon,
  PersonIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import Loading from "../loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatText } from "@/lib/utils";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { useEffect } from "react";
import { formatDistanceStrict } from "date-fns";

export default function Home() {
  const {
    notifications,
    isNotificationsLoading,
    user,
    markNotificationsAsRead,
  } = useUser();

  useEffect(() => {
    if (isNotificationsLoading) return;
    markNotificationsAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotificationsLoading]);

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-col p-2 border-b">
        <div className="text-2xl font-semibold">Notifications</div>
        <div className="text-muted-foreground">Last 3 days</div>
      </div>
      <ScrollArea>
        {isNotificationsLoading ? (
          <Loading />
        ) : (
          notifications.map(({ type, timestamp, user, data, viewed }, i) => {
            const channel = data?.parentUrl
              ? CHANNELS_BY_URL[data.parentUrl]
              : undefined;

            return (
              <div
                key={i}
                className={`flex flex-row border-b ${
                  !viewed ? "bg-zinc-100 dark:bg-zinc-900" : ""
                }`}
              >
                <div
                  className={`p-2 w-12 flex justify-center ${
                    !viewed ? "border-l-4 border-purple-500 inset" : ""
                  }`}
                >
                  {type === "like" ? (
                    <HeartFilledIcon className="w-5 h-5 text-red-500" />
                  ) : type === "recast" ? (
                    <UpdateIcon className="w-5 h-5 text-green-500" />
                  ) : type === "follow" ? (
                    <PersonIcon className="w-5 h-5 text-purple-500" />
                  ) : type === "reply" ? (
                    <ChatBubbleIcon className="w-5 h-5 text-red-500" />
                  ) : type === "mention" ? (
                    <div className="text-lg">@</div>
                  ) : (
                    <></>
                  )}
                </div>
                <div className="flex flex-col space-y-2 py-2">
                  <Link href={`/${user.fname}`}>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.pfp} className="object-cover" />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex flex-row space-x-1 items-center text-sm">
                    <span>
                      <Link href={`/${user.fname}`} className="font-semibold">
                        {user.display || user.fname || user.fid}
                      </Link>
                      {type === "like"
                        ? " liked your post"
                        : type === "recast"
                        ? " recasted your post"
                        : type === "follow"
                        ? " followed you"
                        : type === "reply"
                        ? " replied to your post"
                        : type === "mention"
                        ? " mentioned you in a post"
                        : ""}
                      <span className="text-muted-foreground">{` ${formatDistanceStrict(
                        new Date(timestamp),
                        new Date(),
                        { addSuffix: true }
                      )}`}</span>
                    </span>
                  </div>
                  {data && (
                    <Link
                      href={`/${
                        channel ? `channels/${channel.channelId}` : user.fname
                      }/${data.hash}`}
                      className="max-w-lg w-full border rounded-lg flex flex-col text-sm text-muted-foreground whitespace-pre-wrap break-words tracking-normal space-y-2 p-2 hover:text-foreground transition"
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatText(
                            data.text,
                            data.mentions,
                            [],
                            false
                          ),
                        }}
                      />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
