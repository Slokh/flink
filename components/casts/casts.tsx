/* eslint-disable @next/next/no-img-element */
import { CastsSort, CastsQuery } from "@/lib/types";
import { Cast } from "./cast";
import { CHANNELS_BY_ID } from "@/lib/channels";
import { getCasts, getEntity } from "@/lib/requests";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { buttonVariants } from "../ui/button";

export const CastsTable = async ({
  sort,
  params,
  searchParams,
}: { sort: CastsSort; nav?: React.ReactNode } & CastsQuery) => {
  const page = parseInt(searchParams.page || "1");
  const time = sort === CastsSort.Top ? searchParams.time || "day" : undefined;
  const channel = params.channel
    ? CHANNELS_BY_ID[params.channel] || {
        name: decodeURIComponent(params.channel),
        channelId: params.channel,
        image: {
          url: "/favicon.ico",
        },
        parentUrl: decodeURIComponent(params.channel),
      }
    : undefined;
  const channelId = channel?.channelId;

  let baseHref = "/";
  if (channelId) {
    baseHref += `channel/${channelId}/`;
  }
  if (sort !== CastsSort.Hot) {
    baseHref += sort.toLowerCase();
    if (sort === CastsSort.Top) {
      baseHref += `?time=${time}`;
    }
  }

  let entity;
  if (params.id) {
    entity = await getEntity(params.id, true);
  }

  const casts = await getCasts(
    sort,
    page,
    channel?.parentUrl,
    time,
    entity?.fid
  );

  return (
    <ScrollArea className="h-full">
      <div className="w-full">
        {casts.map((cast, i) => (
          <Cast
            key={cast.hash}
            cast={cast}
            rank={sort !== CastsSort.New ? (page - 1) * 25 + i + 1 : undefined}
            isReply={
              sort === CastsSort.NewReplies || sort === CastsSort.TopReplies
            }
            isLink
          />
        ))}
      </div>
      <CastsPagination href={baseHref} page={page} />
    </ScrollArea>
  );
};

const CastsPagination = ({ href, page }: { href: string; page: number }) => {
  return (
    <div className="flex flex-row space-x-2 p-2 border-t justify-end items-end">
      <a
        href={
          page > 1
            ? `${href}${href.includes("?") ? "&" : "?"}page=${page - 1}`
            : "#"
        }
        className={buttonVariants({
          variant: "outline",
          size: "sm",
        })}
      >
        prev
      </a>
      <a
        href={`${href}${href.includes("?") ? "&" : "?"}page=${page + 1}`}
        className={buttonVariants({
          variant: "outline",
          size: "sm",
        })}
      >
        next
      </a>
    </div>
  );
};
