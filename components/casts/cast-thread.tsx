import { formatText } from "@/lib/utils";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { FarcasterCast, FarcasterCastTree } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceStrict } from "date-fns";
import { EmbedPreview } from "../embeds";
import { MobileCast } from "./cast";
import { CopyLink } from "../copy-link";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import Link from "next/link";
import { DeleteCast } from "../actions/delete-cast";
import { ReplyCastButton } from "../actions/new-cast";
import { LikeCast } from "../actions/like-cast";
import { RecastCast } from "../actions/recast-cast";
import { CollapsibleCast } from "./collapsible-cast";

export const CastContent = ({ cast }: { cast: FarcasterCast }) => {
  const channel = cast.parentUrl ? CHANNELS_BY_URL[cast.parentUrl] : undefined;
  const formattedText = formatText(cast.text, cast.mentions, cast.embeds, true);

  const user = cast.user || {
    fname: "unknown",
    pfp: "",
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex flex-row space-x-2">
        <Link href={`/${user?.fname}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.pfp} className="object-cover" />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col text-sm">
          <Link
            href={`/${user?.fname}`}
            className="flex flex-row space-x-1 cursor-pointer"
          >
            <div className="font-semibold">{user?.display || user?.fname}</div>
            <div className="text-purple-600 dark:text-purple-400 hover:underline">{`@${user?.fname}`}</div>
          </Link>
          <div className="flex flex-row space-x-1 text-sm">
            <div className="text-muted-foreground">
              {formatDistanceStrict(new Date(cast.timestamp), new Date(), {
                addSuffix: true,
              })}
            </div>
            {channel && (
              <>
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

export const CastParent = ({
  cast,
  isHighlighted,
}: {
  cast: FarcasterCast;
  isHighlighted: boolean;
}) => {
  const channel = cast.parentUrl ? CHANNELS_BY_URL[cast.parentUrl] : undefined;

  const user = cast.user || {
    fname: "unknown",
    pfp: "",
  };

  return (
    <div className="flex flex-row space-x-2 pl-2 py-4 w-full pr-12">
      <div className="flex flex-col items-end justify-start text-sm">
        <LikeCast hash={cast.hash} likes={cast.likes} mode="icons" />
        <RecastCast hash={cast.hash} recasts={cast.recasts} mode="icons" />
      </div>
      <div className="flex flex-col space-y-1 w-full">
        <CastContent cast={cast} />
        <div className="text-muted-foreground text-sm flex flex-row space-x-4">
          {isHighlighted && (
            <Link
              href={`/${
                channel ? `channels/${channel.channelId}` : user?.fname
              }/${cast.hash}`}
              className="hover:underline"
            >
              view thread
            </Link>
          )}
          <ReplyCastButton parent={cast} inThread />
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
          <CopyLink
            link={`https://flink.fyi/${
              channel ? `channels/${channel.channelId}` : user?.fname
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

export const CastThread = async ({
  cast,
  hash,
}: {
  cast: FarcasterCastTree;
  hash: string;
}) => {
  return (
    <>
      <div className="hidden md:flex flex-col h-full">
        <ScrollArea className="h-full pl-2">
          <ScrollBar orientation="horizontal" />
          <CastParent cast={cast} isHighlighted={hash !== cast.hash} />
          <div className="flex flex-col space-y-4 m-2">
            {cast.children.map((child) => (
              <CollapsibleCast
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
