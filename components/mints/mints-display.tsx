"use client";
/* eslint-disable @next/next/no-img-element */
import { ScrollArea } from "../ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { useIsVisible } from "@/hooks/useIsVisible";
import { FarcasterCast } from "@/lib/types";
import Masonry from "react-masonry-css";
import { MintEmbed } from "./mint-embed";
import { Loading } from "../loading";
import "./masonry.css";
import { User } from "../user";
import { formatText } from "@/lib/utils";
import { formatDistanceStrict } from "date-fns";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { useUser } from "@/context/user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export const MintDisplayCast = ({ cast }: { cast: FarcasterCast }) => {
  const { user } = useUser();
  const router = useRouter();
  const tx = cast.embeds.find((embed) => embed.transactionMetadata?.token);
  if (!tx) return <></>;
  const formattedText = formatText(cast.text, cast.mentions, false);
  const channel = cast.parentUrl ? CHANNELS_BY_URL[cast.parentUrl] : undefined;
  return (
    <div
      className={`border rounded-lg text-sm hover:bg-border cursor-pointer ${
        user?.follows[cast.user?.fid] ? "border-foreground" : ""
      }`}
    >
      <div
        className="p-2"
        onClick={() =>
          router.push(
            `/${channel ? `channels/${channel.channelId}` : cast.user?.fname}/${
              cast.hash
            }`
          )
        }
      >
        <div className="flex flex-row justify-between items-start">
          <div className="flex flex-row space-x-2">
            <User user={cast.user} showAvatar showUsername />
            <div
              className="text-muted-foreground"
              title={new Date(cast.timestamp).toLocaleString()}
            >
              {formatDistanceStrict(new Date(cast.timestamp), new Date(), {
                addSuffix: true,
              })}
            </div>
          </div>
          {channel && (
            <Link
              href={`/channels/${channel.channelId}`}
              className="hover:underline flex flex-row items-center space-x-1 text-purple-600 dark:text-purple-400"
            >
              <Avatar className="h-4 w-4">
                <AvatarImage src={channel.image} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div>{channel.name}</div>
            </Link>
          )}
        </div>
        <div className="flex flex-col whitespace-pre-wrap break-words space-y-1 h-12 pt-1">
          <div
            dangerouslySetInnerHTML={{ __html: formattedText }}
            className="line-clamp-2"
          />
        </div>
      </div>
      <MintEmbed embed={tx} withoutBorder />
    </div>
  );
};

export const MintsDisplay = ({
  page,
  onlyFollowing,
}: {
  page: number;
  onlyFollowing?: boolean;
}) => {
  const [mints, setMints] = useState<FarcasterCast[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const [done, setDone] = useState(false);
  const container = useRef(null);
  const visible = useIsVisible(container);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const handle = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    let currentPage = Math.floor(mints.length / 25) + page - 1;
    const finalMints: any[] = [];
    let isDone = false;
    do {
      currentPage++;
      const data = await fetch(
        `/api/mints?page=${currentPage}${
          onlyFollowing ? `&viewer=${user?.fid}` : ""
        }`
      );
      const { mints } = await data.json();
      if (mints.length !== 25) {
        isDone = true;
      }
      finalMints.push(...mints);
    } while (finalMints.length === 0 && !isDone);
    setMints((mints) => [...mints, ...finalMints]);
    if (isDone) setDone(true);
    if (firstLoad) {
      setFirstLoad(false);
    }
    setIsProcessing(false);
  };

  useEffect(() => {
    if (visible && !done && (!onlyFollowing || (onlyFollowing && user?.fid))) {
      handle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mints, done, user]);

  const breakpointColumnsObj = {
    default: 4,
    1280: 3,
    1024: 2,
    768: 1,
    640: 1,
  };

  return (
    <div>
      <div className="mx-2 mt-2 flex justify-between">
        <div className="flex flex-row space-x-2 items-center text-sm">
          <div>
            <ExclamationTriangleIcon className="text-yellow-500" />
          </div>
          <div className="max-w-2xl">
            This is a raw feed of all shared mint links, please be cautious and
            only mint using links from people you trust. This is also an
            experimental feature so please report bugs to{" "}
            <a href="/slokh" className="hover:underline">
              @slokh
            </a>
          </div>
        </div>
        {user && (
          <div>
            <Select
              value={onlyFollowing ? "following" : ""}
              onValueChange={(v) =>
                v === "following"
                  ? router.push(`/mints/following`)
                  : router.push(`/mints`)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All mints" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All mints</SelectItem>
                <SelectItem value="following">Only following</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <ScrollArea className="flex h-full p-1">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {mints
            .filter((m) =>
              m.embeds.find((embed) => embed.transactionMetadata?.token)
            )
            .map((mint, i) => (
              <div key={mint.hash} className="p-1">
                <MintDisplayCast cast={mint} />
              </div>
            ))}
        </Masonry>
        {!done && (
          <div className="p-4" ref={container}>
            <Loading />
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
