/* eslint-disable @next/next/no-img-element */
import { Embed, FarcasterCast, NftMetadata } from "@/lib/types";
import { formatText } from "@/lib/casts";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceStrict } from "date-fns";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { Metadata } from "unfurl.js/dist/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChatBubbleIcon,
  HeartFilledIcon,
  HeartIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  format,
} from "date-fns";
import { EmbedPreview } from "../embeds";
import { CopyLink } from "../copy-link";

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
        <a href={externalUrl} target="_blank">
          <img
            src={previewImage}
            alt={previewImage}
            className="object-cover w-16 h-16"
          />
        </a>
      );
    }
    return (
      <Dialog>
        <DialogTrigger>
          <img
            src={previewImage}
            alt={previewImage}
            className="object-cover w-16 h-16"
          />
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="h-4"></DialogTitle>
            <DialogDescription>
              <img
                src={previewImage}
                alt={previewImage}
                className="rounded-lg"
              />
            </DialogDescription>
          </DialogHeader>
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
      xmlns="http://www.w3.org/2000/svg"
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
  showRank,
  isReply,
}: {
  rank: number;
  cast: FarcasterCast;
  showRank?: boolean;
  isReply?: boolean;
}) => {
  const community = cast.parentUrl
    ? CHANNELS_BY_URL[cast.parentUrl]
    : undefined;
  const formattedText = formatText(
    cast.text,
    cast.mentions,
    cast.embeds,
    false
  );
  const { previewImage, externalUrl } = getPreview(cast.embeds);

  const isXpost = [
    externalUrl?.includes("warpcast.com") ||
      externalUrl?.includes("twitter.com") ||
      externalUrl?.includes("x.com"),
  ];

  return (
    <div className="hidden md:flex flex-row items-center border-b hover:bg-zinc-100 pl-4 hover:dark:bg-zinc-900 transition-all">
      {showRank && (
        <div className="flex w-6 items-center justify-center text-zinc-500 font-semibold">
          {rank}
        </div>
      )}
      <div className="flex flex-col w-20 items-center justify-center text-sm">
        <div className="flex flex-row items-center space-x-1">
          <HeartFilledIcon className="text-red-500" />
          <div>{cast.likes}</div>
        </div>
        <div className="flex flex-row items-center space-x-1">
          <UpdateIcon className="text-green-500" />
          <div>{cast.recasts}</div>
        </div>
      </div>
      <div className="flex w-20 justify-center items-center text-zinc-500">
        <CastPreview previewImage={previewImage} externalUrl={externalUrl} />
      </div>
      <div className="flex flex-col w-full p-2">
        {isReply && (
          <div className="text-xs text-zinc-500">
            replying to{" "}
            <a
              href={`/${cast.parentCast?.user.fname}`}
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >{`@${cast.parentCast?.user.fname}`}</a>
          </div>
        )}
        <a
          href={
            cast.topParentCast && cast.hash === cast.topParentCast?.hash
              ? `/${cast.user.fname}/${cast.hash}`
              : `/${cast.topParentCast?.user?.fname}/${cast.topParentCast?.hash}/${cast.hash}`
          }
          className="transition-all hover:text-purple-600 hover:dark:text-purple-400 line-clamp-2"
        >
          {formattedText ? (
            <div dangerouslySetInnerHTML={{ __html: formattedText }} />
          ) : isXpost ? (
            "x-post"
          ) : (
            "untitled"
          )}
        </a>
        <div className="flex flex-row space-x-1">
          <div className="flex flex-row space-x-1 items-center text-purple-600 dark:text-purple-400 text-sm">
            <div className="text-zinc-500">
              {formatDistanceStrict(new Date(cast.timestamp), new Date(), {
                addSuffix: true,
              })}
            </div>
            <div className="text-zinc-500">by</div>
            <a href={`/${cast.user.fname}`}>
              <Avatar className="h-4 w-4">
                <AvatarImage src={cast.user.pfp} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            </a>
            <a href={`/${cast.user.fname}`} className="hover:underline">
              <div>{cast.user.fname}</div>
            </a>
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
        <div className="text-zinc-500 text-sm font-medium flex flex-row space-x-2">
          <a
            href={
              isReply
                ? `/${cast.parentCast?.user.fname}/${cast.parentCast?.hash}/${cast.hash}`
                : `/${cast.user.fname}/${cast.hash}`
            }
            className="hover:underline"
          >
            {`${cast.replies} replies`}
          </a>
          <a
            href={`https://warpcast.com/${cast.user.fname}/${cast.hash.slice(
              0,
              8
            )}`}
            target="_blank"
            className="hover:underline"
          >
            warpcast
          </a>
          <CopyLink
            link={
              isReply
                ? `https://flink.fyi/${cast.parentCast?.user.fname}/${cast.parentCast?.hash}/${cast.hash}`
                : `https://flink.fyi/${cast.user.fname}/${cast.hash}`
            }
          />
        </div>
      </div>
    </div>
  );
};

export const MobileCast = ({
  cast,
  isParent,
  isReply,
}: {
  cast: FarcasterCast;
  isParent?: boolean;
  isReply?: boolean;
}) => {
  const community = cast.parentUrl
    ? CHANNELS_BY_URL[cast.parentUrl]
    : undefined;
  const formattedText = formatText(cast.text, cast.mentions, cast.embeds, true);
  return (
    <div className="flex md:hidden flex-col space-y-2 border-b p-2">
      {isReply && (
        <div className="text-xs text-zinc-500">
          replying to{" "}
          <a
            href={`/${cast.parentCast?.user.fname}`}
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >{`@${cast.parentCast?.user.fname}`}</a>
        </div>
      )}
      <div className="flex flex-row space-x-2">
        {!isParent && (
          <a href={`/${cast.user.fname}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={cast.user.pfp} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          </a>
        )}
        <div className="flex flex-col space-y-1 w-full">
          <div className="flex flex-row space-x-2">
            {isParent && (
              <a href={`/${cast.user.fname}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={cast.user.pfp} className="object-cover" />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
              </a>
            )}
            <div className="w-full flex flex-row space-x-2 justify-between">
              <a href={`/${cast.user.fname}`} className="flex flex-col">
                <div className="font-semibold text-sm">
                  {cast.user.display || cast.user.fname}
                </div>
                <div className="font-normal text-sm text-zinc-500">{`@${cast.user.fname}`}</div>
              </a>
              <div className="font-normal text-sm text-zinc-500">
                {formatDistanceCustom(new Date(cast.timestamp), new Date())}
              </div>
            </div>
          </div>
          <a
            href={`/${cast.user.fname}/${cast.hash}`}
            className="flex flex-col text-sm whitespace-pre-wrap break-words pb-2 text-base leading-5 tracking-normal"
          >
            <div dangerouslySetInnerHTML={{ __html: formattedText }} />
          </a>
          {cast.embeds
            .filter(({ parsed }) => !parsed)
            .map((embed, i) => (
              <EmbedPreview key={i} embed={embed} />
            ))}
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-row space-x-4 text-zinc-500">
              <div className="flex flex-row space-x-1 items-center text-sm">
                <ChatBubbleIcon />
                <div>{cast.replies}</div>
              </div>
              <div className="flex flex-row space-x-1 items-center text-sm">
                <UpdateIcon />
                <div>{cast.recasts}</div>
              </div>
              <div className="flex flex-row space-x-1 items-center text-sm">
                <HeartIcon />
                <div>{cast.likes}</div>
              </div>
            </div>
            {community && (
              <div className="flex flex-row space-x-1 items-center text-purple-600 dark:text-purple-400 text-sm">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Cast = ({
  rank,
  cast,
  showRank,
  isReply,
}: {
  rank: number;
  cast: FarcasterCast;
  showRank?: boolean;
  isReply?: boolean;
}) => {
  return (
    <>
      <WebCast rank={rank} cast={cast} showRank={showRank} isReply={isReply} />
      <MobileCast cast={cast} isReply={isReply} />
    </>
  );
};
