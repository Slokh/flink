"use client";
import { formatText } from "@/lib/casts";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { FarcasterCast, FarcasterCastTree } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceStrict } from "date-fns";
import { EmbedPreview } from "../embeds";
import { HeartFilledIcon, UpdateIcon } from "@radix-ui/react-icons";
import { useEffect, useRef } from "react";
import { MobileCast } from "./cast";
import { CopyLink } from "../copy-link";
import { ScrollArea } from "../ui/scroll-area";

const CastParent = ({ cast }: { cast: FarcasterCast }) => {
  const community = cast.parentUrl
    ? CHANNELS_BY_URL[cast.parentUrl]
    : undefined;
  const formattedText = formatText(cast.text, cast.mentions, cast.embeds, true);
  return (
    <div className="flex flex-row space-x-2 max-w-2xl m-4">
      <div className="flex flex-col w-12 items-center text-sm">
        <div className="flex flex-row items-center space-x-1 text-red-500 font-semibold">
          <HeartFilledIcon />
          <div>{cast.likes}</div>
        </div>
        <div className="flex flex-row items-center space-x-1 text-green-500">
          <UpdateIcon />
          <div>{cast.recasts}</div>
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex flex-row space-x-2">
          <a href={`/${cast.user.fname}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={cast.user.pfp} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          </a>
          <div className="flex flex-col text-sm">
            <a
              href={`/${cast.user.fname}`}
              className="flex flex-row space-x-1 cursor-pointer"
            >
              <div className="font-semibold">
                {cast.user.display || cast.user.fname}
              </div>
              <div className="text-purple-600 dark:text-purple-400 hover:underline">{`@${cast.user.fname}`}</div>
            </a>
            <div className="flex flex-row space-x-1 text-sm">
              <div className="text-zinc-500">
                {formatDistanceStrict(new Date(cast.timestamp), new Date(), {
                  addSuffix: true,
                })}
              </div>
              {community && (
                <>
                  <div className="text-zinc-500">in</div>
                  <a
                    href={`/channel/${community.channelId}`}
                    className="hover:underline"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage
                        src={community.image}
                        className="object-cover"
                      />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                  </a>
                  <a
                    href={`/channel/${community.channelId}`}
                    className="hover:underline"
                  >
                    <div>{community.name}</div>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col whitespace-pre-wrap break-words leading-6 tracking-normal w-full space-y-2 border rounded-lg p-2">
          <div dangerouslySetInnerHTML={{ __html: formattedText }} />
          {cast.embeds.length > 0 && (
            <div className="flex flex-row flex-wrap">
              {cast.embeds
                .filter(({ parsed }) => !parsed)
                .map((embed, i) => (
                  <EmbedPreview key={i} embed={embed} />
                ))}
            </div>
          )}
        </div>
        <div className="text-zinc-500 text-sm font-medium flex flex-row space-x-4">
          <a
            href={`https://warpcast.com/${cast.user.fname}/${cast.hash.slice(
              0,
              8
            )}`}
            target="_blank"
            className="hover:underline"
          >
            reply on warpcast
          </a>
          <CopyLink
            link={`https://flink.fyi/${cast.user.fname}/${cast.hash}`}
          />
        </div>
      </div>
    </div>
  );
};

const CastChild = ({
  cast,
  highlight,
}: {
  cast: FarcasterCastTree;
  highlight: string;
}) => {
  const castRef = useRef(null);

  useEffect(() => {
    if (highlight === cast.hash) {
      // @ts-ignore
      castRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [highlight, cast.hash]);

  const formattedText = formatText(
    cast.text,
    cast.mentions,
    cast.embeds,
    false
  );
  return (
    <div className="flex flex-col p-2">
      <div
        className={`flex flex-row space-x-2 ${
          highlight === cast.hash
            ? "p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800"
            : ""
        }`}
        ref={castRef}
      >
        <div className="flex flex-col min-w-12 items-end text-sm">
          <div className="flex flex-row items-center space-x-1 text-red-500 font-semibold">
            <HeartFilledIcon />
            <div>{cast.likes}</div>
          </div>
          <div className="flex flex-row items-center space-x-1 text-green-500">
            <UpdateIcon />
            <div>{cast.recasts}</div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex flex-row space-x-2 text-sm">
            <a href={`/${cast.user.fname}`}>
              <Avatar className="h-5 w-5">
                <AvatarImage src={cast.user.pfp} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            </a>
            <a
              href={`/${cast.user.fname}`}
              className="flex flex-row space-x-1 cursor-pointer"
            >
              <div className="font-semibold">
                {cast.user.display || cast.user.fname}
              </div>
              <div className="text-purple-600 dark:text-purple-400 hover:underline">{`@${cast.user.fname}`}</div>
            </a>
          </div>
          <div className="max-w-2xl flex flex-col whitespace-pre-wrap break-words text-md leading-6 tracking-normal w-full space-y-2 p-2">
            <div dangerouslySetInnerHTML={{ __html: formattedText }} />
          </div>
          {cast.embeds.length > 0 && (
            <div className="flex flex-row flex-wrap">
              {cast.embeds
                .filter(({ parsed }) => !parsed)
                .map((embed, i) => (
                  <EmbedPreview key={i} embed={embed} />
                ))}
            </div>
          )}
          <div className="text-zinc-500 text-sm font-medium flex flex-row space-x-4">
            <a
              href={`https://warpcast.com/${cast.user.fname}/${cast.hash.slice(
                0,
                8
              )}`}
              target="_blank"
              className="hover:underline"
            >
              reply on warpcast
            </a>
            <CopyLink
              link={`https://flink.fyi/${cast.parentCast?.user.fname}/${cast.parentCast?.hash}/${cast.hash}`}
            />
          </div>
        </div>
      </div>
      {cast.children.length > 0 && (
        <div className="flex flex-col border-l mt-2 ml-9">
          {cast.children.map((child) => (
            <CastChild key={child.hash} cast={child} highlight={highlight} />
          ))}
        </div>
      )}
    </div>
  );
};

export const CastThread = async ({
  cast,
  highlight,
}: {
  cast: FarcasterCastTree;
  highlight: string;
}) => {
  return (
    <div>
      <div className="hidden md:flex flex-col w-full h-full">
        <ScrollArea className="h-full">
          <CastParent cast={cast} />
          <div className="flex flex-col space-y-4 m-2">
            {cast.children.map((child) => (
              <CastChild key={child.hash} cast={child} highlight={highlight} />
            ))}
          </div>
        </ScrollArea>
      </div>
      <div>
        <MobileCast cast={cast} isParent />
        {cast.children.map((child) => (
          <MobileCast key={child.hash} cast={child} />
        ))}
      </div>
    </div>
  );
};
