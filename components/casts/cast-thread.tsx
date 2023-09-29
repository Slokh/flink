import { formatText } from "@/lib/utils";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { FarcasterCast, FarcasterCastTree } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceStrict } from "date-fns";
import { EmbedPreview } from "../embeds";
import { MobileCast } from "./cast";
import { CopyLink } from "../copy-link";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { DeleteCast } from "../actions/delete-cast";
import { ReplyCastButton } from "../actions/new-cast";
import { LikeCast } from "../actions/like-cast";
import { RecastCast } from "../actions/recast-cast";
import { Separator } from "../ui/separator";

export const CastContent = ({ cast }: { cast: FarcasterCast }) => {
  const channel = cast.parentUrl ? CHANNELS_BY_URL[cast.parentUrl] : undefined;
  const formattedText = formatText(cast.text, cast.mentions, cast.embeds, true);
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex flex-row space-x-2">
        <Link href={`/${cast.user.fname}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={cast.user.pfp} className="object-cover" />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col text-sm">
          <Link
            href={`/${cast.user.fname}`}
            className="flex flex-row space-x-1 cursor-pointer"
          >
            <div className="font-semibold">
              {cast.user.display || cast.user.fname}
            </div>
            <div className="text-purple-600 dark:text-purple-400 hover:underline">{`@${cast.user.fname}`}</div>
          </Link>
          <div className="flex flex-row space-x-1 text-sm">
            <div className="text-zinc-500">
              {formatDistanceStrict(new Date(cast.timestamp), new Date(), {
                addSuffix: true,
              })}
            </div>
            {channel && (
              <>
                <div className="text-zinc-500">in</div>
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
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col whitespace-pre-wrap break-words leading-6 tracking-normal w-full space-y-2 border rounded-lg p-2">
        <div dangerouslySetInnerHTML={{ __html: formattedText }} />
        {cast.embeds.length > 0 && (
          <div className="flex flex-row flex-wrap">
            {cast.embeds.map((embed, i) => (
              <div key={i} className="w-1/2 pr-2">
                <EmbedPreview embed={embed} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CastParent = ({ cast }: { cast: FarcasterCast }) => {
  const channel = cast.parentUrl ? CHANNELS_BY_URL[cast.parentUrl] : undefined;
  return (
    <div className="flex flex-row space-x-2 p-4 w-full">
      <div className="flex flex-col items-end justify-start text-sm pr-1 pl-1">
        <LikeCast hash={cast.hash} likes={cast.likes} mode="icons" />
        <RecastCast hash={cast.hash} recasts={cast.recasts} mode="icons" />
      </div>
      <div className="flex flex-col space-y-1 w-full">
        <CastContent cast={cast} />
        <div className="text-zinc-500 text-sm flex flex-row space-x-4">
          <ReplyCastButton parent={cast} />
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
            link={`https://flink.fyi/${
              channel ? `channels/${channel.channelId}` : cast.user.fname
            }/${cast.hash}`}
          />
          <DeleteCast hash={cast.hash}>
            <div className="hover:underline">delete</div>
          </DeleteCast>
        </div>
      </div>
    </div>
  );
};

const CastChild = ({
  cast,
  isHighlighted,
}: {
  cast: FarcasterCastTree;
  isHighlighted?: boolean;
}) => {
  const formattedText = formatText(cast.text, cast.mentions, cast.embeds, true);
  return (
    <div className="flex flex-row">
      <div className="flex flex-col items-center px-2">
        <div className="flex flex-col items-end justify-start text-sm cursor-pointer">
          <LikeCast hash={cast.hash} likes={cast.likes} mode="icons" />
          <RecastCast hash={cast.hash} recasts={cast.recasts} mode="icons" />
        </div>
        {cast.children?.length > 0 && (
          <div className="h-full pt-2">
            <Separator orientation="vertical" />
          </div>
        )}
      </div>
      <div className="flex flex-col w-full">
        <div
          className={`flex flex-row space-x-2 w-full ${
            isHighlighted
              ? "border-black dark:border-white p-2 border rounded-lg"
              : ""
          }`}
        >
          <div className="flex flex-col pt-1 w-full">
            <div className="flex flex-row space-x-2 text-sm">
              <Link href={`/${cast.user.fname}`}>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={cast.user.pfp} className="object-cover" />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
              </Link>
              <Link
                href={`/${cast.user.fname}`}
                className="flex flex-row space-x-1 cursor-pointer"
              >
                <div className="font-semibold">
                  {cast.user.display || cast.user.fname}
                </div>
                <div className="text-purple-600 dark:text-purple-400 hover:underline">{`@${cast.user.fname}`}</div>
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
                href={`https://warpcast.com/${
                  cast.user.fname
                }/${cast.hash.slice(0, 8)}`}
                target="_blank"
                className="hover:underline"
              >
                warpcast
              </a>
              <CopyLink
                link={`https://flink.fyi/${cast.user.fname}/${cast.hash}`}
              />
              <DeleteCast hash={cast.hash} isReply>
                <div className="hover:underline">delete</div>
              </DeleteCast>
            </div>
          </div>
        </div>
        {cast.children.length > 0 && (
          <div className="flex flex-col mt-4">
            {cast.children.map((child) => (
              <CastChild key={child.hash} cast={child} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CastThread = async ({
  cast,
  hash,
}: {
  cast: FarcasterCastTree;
  hash: string;
}) => {
  return (
    <>
      <div className="hidden md:flex flex-col w-full h-full">
        <ScrollArea className="h-full pl-2">
          <CastParent cast={cast} />
          <div className="flex flex-col space-y-4 m-2">
            {cast.children.map((child) => (
              <CastChild
                key={child.hash}
                cast={child}
                isHighlighted={hash === child.hash}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex md:hidden flex-col w-full">
        <MobileCast cast={cast} isLink={false} />
        {cast.children.map((child) => (
          <MobileCast key={child.hash} cast={child} />
        ))}
      </div>
    </>
  );
};
