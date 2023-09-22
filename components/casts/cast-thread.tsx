import { formatText } from "@/lib/casts";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { FarcasterCast, FarcasterCastTree } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceStrict } from "date-fns";
import { EmbedPreview } from "../embeds";
import { HeartFilledIcon, UpdateIcon } from "@radix-ui/react-icons";
import { MobileCast } from "./cast";
import { CopyLink } from "../copy-link";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { CastReactions } from "./cast-reactions";
import { DeleteCast } from "../actions/delete-cast";
import { NewCast } from "../actions/new-cast";

const CastParent = ({ cast }: { cast: FarcasterCast }) => {
  const community = cast.parentUrl
    ? CHANNELS_BY_URL[cast.parentUrl]
    : undefined;
  const formattedText = formatText(cast.text, cast.mentions, cast.embeds, true);
  return (
    <div className="flex flex-row space-x-2 p-4 w-full">
      <CastReactions
        likes={cast.likes}
        recasts={cast.recasts}
        hash={cast.hash}
      />
      <div className="flex flex-col space-y-1 w-full">
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
              {community && (
                <>
                  <div className="text-zinc-500">in</div>
                  <Link
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
                  </Link>
                  <Link
                    href={`/channel/${community.channelId}`}
                    className="hover:underline"
                  >
                    <div>{community.name}</div>
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
              {cast.embeds
                .filter(({ parsed }) => !parsed)
                .map((embed, i) => (
                  <EmbedPreview key={i} embed={embed} />
                ))}
            </div>
          )}
        </div>
        <div className="text-zinc-500 text-sm font-medium flex flex-row space-x-4">
          <NewCast reply={{ fid: cast.user.fid, hash: cast.hash }}>
            <div className="hover:underline">reply</div>
          </NewCast>
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
            link={`https://flink.fyi/${cast.user.fname}/${cast.hash}`}
          />
          <DeleteCast hash={cast.hash}>
            <div className="hover:underline">delete</div>
          </DeleteCast>
        </div>
      </div>
    </div>
  );
};

const CastChild = ({ cast }: { cast: FarcasterCastTree }) => {
  const formattedText = formatText(cast.text, cast.mentions, cast.embeds, true);
  return (
    <div className="flex flex-col p-2">
      <div className="flex flex-row space-x-2">
        <CastReactions
          likes={cast.likes}
          recasts={cast.recasts}
          hash={cast.hash}
        />
        <div className="flex flex-col">
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
          <div className="max-w-2xl flex flex-col whitespace-pre-wrap break-words text-md leading-6 tracking-normal w-full space-y-2 p-2">
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
            <NewCast reply={{ fid: cast.user.fid, hash: cast.hash }}>
              <div className="hover:underline">reply</div>
            </NewCast>
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
              link={`https://flink.fyi/${cast.parentCast?.user.fname}/${cast.parentCast?.hash}/${cast.hash}`}
            />
            <DeleteCast hash={cast.hash} isReply>
              <div className="hover:underline">delete</div>
            </DeleteCast>
          </div>
        </div>
      </div>
      {cast.children.length > 0 && (
        <div className="flex flex-col border-l mt-2 ml-9">
          {cast.children.map((child) => (
            <CastChild key={child.hash} cast={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export const CastThread = async ({ cast }: { cast: FarcasterCastTree }) => {
  return (
    <>
      <div className="hidden md:flex flex-col w-full h-full">
        <ScrollArea className="h-full pl-2">
          <CastParent cast={cast} />
          <div className="flex flex-col space-y-4 m-2">
            {cast.children.map((child) => (
              <CastChild key={child.hash} cast={child} />
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex md:hidden flex-col w-full">
        <MobileCast cast={cast} isParent isLink={false} />
        {/* {cast.children.map((child) => (
          <MobileCast key={child.hash} cast={child} />
        ))} */}
      </div>
    </>
  );
};
