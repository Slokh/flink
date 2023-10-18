/* eslint-disable @next/next/no-img-element */
import { Embed, FarcasterCast, NftMetadata } from "@/lib/types";
import { formatText } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceStrict } from "date-fns";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { Metadata } from "unfurl.js/dist/types";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  format,
} from "date-fns";
import { EmbedPreview } from "../embeds";
import { CopyLink } from "../copy-link";
import { ReplyCastButton, XPostButton } from "../actions/new-cast";
import Link from "next/link";
import { DeleteCast } from "../actions/delete-cast";
import { LikeCast } from "../actions/like-cast";
import { RecastCast } from "../actions/recast-cast";
import { User } from "../user";

const formatDistanceCustom = (date1: Date, date2: Date) => {
  const diffInSeconds = differenceInSeconds(date2, date1);
  const diffInMinutes = differenceInMinutes(date2, date1);
  const diffInHours = differenceInHours(date2, date1);
  const diffInDays = differenceInDays(date2, date1);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    return format(date1, "MMM do");
  }
};

export const getPreview = (embeds: Embed[]) => {
  let previewImage = embeds.find((embed) =>
    embed.contentType?.startsWith("image/")
  )?.url;
  let externalUrl;

  if (!previewImage) {
    previewImage = (
      embeds.find((embed) => embed.url.startsWith("chain://"))
        ?.contentMetadata as NftMetadata
    )?.image_url;
  }

  if (!previewImage) {
    const embed = embeds.find(
      (embed) =>
        (embed.contentMetadata as Metadata)?.twitter_card?.images?.length ||
        (embed.contentMetadata as Metadata).open_graph?.images?.length
    );
    if (embed) {
      const metadata = embed.contentMetadata as Metadata;
      previewImage =
        metadata?.twitter_card?.images?.[0]?.url ||
        metadata?.open_graph?.images?.[0]?.url;
      if (embed.contentType?.startsWith("text/html")) {
        externalUrl = embed.url.startsWith("http")
          ? embed.url
          : `https://${embed.url}`;
      }
    }
  }

  return { previewImage, externalUrl };
};

const CastPreview = ({
  previewImage,
  externalUrl,
}: {
  previewImage?: string;
  externalUrl?: string;
}) => {
  if (previewImage) {
    if (externalUrl) {
      return (
        <Link href={externalUrl} target="_blank">
          <img
            src={previewImage}
            alt={previewImage}
            className="object-cover w-16 h-16"
          />
        </Link>
      );
    }
    return (
      <Dialog>
        <DialogTrigger>
          <img
            src={previewImage}
            alt={previewImage}
            className="rounded-lg object-cover w-16 h-16"
          />
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 md:w-fit">
          <img
            src={previewImage}
            alt={previewImage}
            className="rounded-lg object-contain max-h-full"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="https://www.w3.org/2000/svg"
    >
      <path
        d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

const WebCast = ({
  rank,
  cast,
  isReply,
}: {
  cast: FarcasterCast;
  rank?: number;
  isReply?: boolean;
}) => {
  const channel = cast.parentUrl ? CHANNELS_BY_URL[cast.parentUrl] : undefined;
  const formattedText = formatText(cast.text, cast.mentions, true);
  const { previewImage, externalUrl } = getPreview(cast.embeds);

  const isXpost = [
    externalUrl?.includes("warpcast.com") ||
      externalUrl?.includes("twitter.com") ||
      externalUrl?.includes("x.com"),
  ];

  const user = cast.user || {
    fname: "unknown",
    pfp: "",
  };

  return (
    <div className="hidden md:flex flex-row items-center border-b hover:bg-zinc-100 pl-4 hover:dark:bg-zinc-900 transition-all">
      {rank && (
        <div className="flex w-6 items-center justify-center text-muted-foreground font-semibold">
          {rank}
        </div>
      )}
      <div className="flex flex-col items-end justify-start text-sm pr-1 pl-1 w-16">
        <LikeCast hash={cast.hash} likes={cast.likes} mode="icons" />
        <RecastCast hash={cast.hash} recasts={cast.recasts} mode="icons" />
      </div>
      <div className="flex w-20 justify-center items-center text-muted-foreground">
        <CastPreview previewImage={previewImage} externalUrl={externalUrl} />
      </div>
      <div className="flex flex-col w-full p-2">
        {isReply && (
          <div className="text-xs text-muted-foreground">
            replying to{" "}
            <Link
              href={`/${cast.parentCast?.user?.fname}`}
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >{`@${cast.parentCast?.user?.fname}`}</Link>
          </div>
        )}
        <Link
          href={`/${channel ? `channels/${channel.channelId}` : user?.fname}/${
            cast.hash
          }`}
          className="transition-all hover:text-purple-600 hover:dark:text-purple-400 line-clamp-2 visited:text-purple-600 visited:dark:text-purple-400"
        >
          {formattedText ? (
            <div dangerouslySetInnerHTML={{ __html: formattedText }} />
          ) : isXpost ? (
            "x-post"
          ) : (
            "untitled"
          )}
        </Link>
        <div className="flex flex-row space-x-1">
          <div className="flex flex-row space-x-1 items-center text-sm">
            <div
              className="text-muted-foreground"
              title={new Date(cast.timestamp).toLocaleString()}
            >
              {formatDistanceStrict(new Date(cast.timestamp), new Date(), {
                addSuffix: true,
              })}
            </div>
            <div className="text-muted-foreground">by</div>
            <User user={user} showAvatar showUsername />
            {channel && (
              <>
                <div className="text-muted-foreground">in</div>
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
              </>
            )}
          </div>
        </div>
        <div className="text-muted-foreground text-sm font-medium flex flex-row space-x-2">
          <Link
            href={`/${
              channel ? `channels/${channel.channelId}` : user?.fname
            }/${cast.hash}`}
            className="hover:underline"
          >
            {`${cast.replies} replies`}
          </Link>
          <ReplyCastButton parent={cast} />
          <a
            href={`https://warpcast.com/${user?.fname}/${cast.hash.slice(
              0,
              8
            )}`}
            target="_blank"
            className="hover:underline"
          >
            warpcast
          </a>
          <CopyLink link={`https://flink.fyi/${user?.fname}/${cast.hash}`} />
          <XPostButton cast={cast} />
          <DeleteCast hash={cast.hash}>
            <div className="hover:underline">delete</div>
          </DeleteCast>
        </div>
      </div>
    </div>
  );
};

export const MobileCast = ({
  cast,
  rank,
  isReply,
  isLink,
}: {
  cast: FarcasterCast;
  rank?: number;
  isReply?: boolean;
  isLink?: boolean;
}) => {
  const channel = cast.parentUrl ? CHANNELS_BY_URL[cast.parentUrl] : undefined;
  const formattedText = formatText(cast.text, cast.mentions, false);

  const { externalUrl } = getPreview(cast.embeds);

  const isXpost =
    externalUrl?.includes("warpcast.com") ||
    externalUrl?.includes("twitter.com") ||
    externalUrl?.includes("x.com");

  const user = cast.user || {
    fname: "unknown",
    pfp: "",
  };

  return (
    <div className="flex md:hidden flex-col p-2 border-b hover:bg-zinc-100 hover:dark:bg-zinc-900 transition-all space-y-1">
      <div className="flex flex-row items-center space-x-1 text-sm w-full justify-between">
        <div className="flex flex-row items-center space-x-1">
          {rank && (
            <div className="flex text-muted-foreground font-semibold">{`${rank}.`}</div>
          )}
          <Link href={`/${user?.fname}`}>
            <Avatar className="h-4 w-4">
              <AvatarImage src={user?.pfp} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/${user?.fname}`} className="hover:underline">
            <div>{user?.fname}</div>
          </Link>
        </div>
        <div className="text-muted-foreground">
          {formatDistanceCustom(new Date(cast.timestamp), new Date())}
        </div>
      </div>
      {isReply && (
        <div className="text-xs text-muted-foreground">
          replying to{" "}
          <Link
            href={`/${cast.parentCast?.user?.fname}`}
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >{`@${cast.parentCast?.user?.fname}`}</Link>
        </div>
      )}
      {isLink ? (
        <Link
          href={`/${channel ? `channels/${channel.channelId}` : user?.fname}/${
            cast.hash
          }`}
          className="text-sm transition-all hover:text-purple-600 hover:dark:text-purple-400 visited:text-purple-600 visited:dark:text-purple-400 whitespace-pre-line break-words"
        >
          <div
            dangerouslySetInnerHTML={{
              __html: formattedText
                ? formattedText
                : isXpost
                ? "x-post"
                : "untitled",
            }}
          />
        </Link>
      ) : (
        <div className="text-sm transition-all hover:text-purple-600 hover:dark:text-purple-400 visited:text-purple-600 visited:dark:text-purple-400 whitespace-pre-line break-words">
          <div
            dangerouslySetInnerHTML={{
              __html: formattedText ? formattedText : isXpost ? "x-post" : "",
            }}
          />
        </div>
      )}
      {cast.embeds.length > 0 && <EmbedPreview embed={cast.embeds[0]} />}
      <div className="text-muted-foreground text-sm font-medium flex flex-row space-x-1 items-center">
        <Link href={`/${user?.fname}/${cast.hash}`} className="hover:underline">
          {`${cast.replies} replies`}
        </Link>
        <LikeCast hash={cast.hash} likes={cast.likes} mode="text" />
        <RecastCast hash={cast.hash} recasts={cast.recasts} mode="text" />
      </div>
      {channel && (
        <div className="text-muted-foreground text-sm font-medium flex flex-row space-x-1 items-center justify-end">
          <div className="text-muted-foreground">in</div>
          <Link
            href={`/channels/${channel.channelId}`}
            className="hover:underline"
          >
            <Avatar className="h-4 w-4">
              <AvatarImage src={channel.image} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          </Link>
          <Link
            href={`/channels/${channel.channelId}`}
            className="hover:underline"
          >
            <div>{channel.name}</div>
          </Link>
        </div>
      )}
    </div>
  );
};

export const Cast = ({
  rank,
  cast,
  isReply,
}: {
  cast: FarcasterCast;
  rank?: number;
  isReply?: boolean;
  isLink?: boolean;
}) => {
  return (
    <>
      <WebCast rank={rank} cast={cast} isReply={isReply} />
      <MobileCast cast={cast} rank={rank} isReply={isReply} />
    </>
  );
};
