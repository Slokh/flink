/* eslint-disable @next/next/no-img-element */
import { CastsSort, CastsQuery } from "@/lib/types";
import { CHANNELS_BY_ID } from "@/lib/channels";
import { getEntity } from "@/lib/requests";
import { ScrollArea } from "../ui/scroll-area";
import { Cast } from "./cast";
import { getCasts } from "@/lib/requests";
import { MoreCasts } from "./more-casts";

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

  let entity;
  if (params.id) {
    entity = await getEntity(params.id, false);
  }

  let baseHref = "/";
  if (channel?.channelId) {
    baseHref += `channel/${channel.channelId}/`;
  }
  if (sort !== CastsSort.Hot) {
    baseHref += sort.toLowerCase();
    if (sort === CastsSort.Top) {
      baseHref += `?time=${time}`;
    }
  }

  const casts = await getCasts(
    sort,
    page,
    channel?.parentUrl,
    time,
    entity?.fid
  );

  return (
    <>
      <ScrollArea className="hidden md:flex md:h-full">
        <div className="flex flex-col w-full">
          {casts.map((cast, i) => (
            <Cast
              key={cast.hash}
              cast={cast}
              rank={sort !== CastsSort.New ? i + 1 : undefined}
              isReply={
                sort === CastsSort.NewReplies || sort === CastsSort.TopReplies
              }
              isLink
            />
          ))}
          <MoreCasts
            sort={sort}
            page={page + 1}
            parentUrl={channel?.parentUrl}
            time={time}
            fid={entity?.fid}
          />
        </div>
      </ScrollArea>
      <div className="flex md:hidden flex-col w-full">
        {casts.map((cast, i) => (
          <Cast
            key={cast.hash}
            cast={cast}
            rank={sort !== CastsSort.New ? i + 1 : undefined}
            isReply={
              sort === CastsSort.NewReplies || sort === CastsSort.TopReplies
            }
            isLink
          />
        ))}
        <MoreCasts
          sort={sort}
          page={page + 1}
          parentUrl={channel?.parentUrl}
          time={time}
          fid={entity?.fid}
        />
      </div>
    </>
  );
};
