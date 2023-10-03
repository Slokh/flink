/* eslint-disable @next/next/no-img-element */
import { CastsSort, CastsQuery } from "@/lib/types";
import { CHANNELS_BY_ID } from "@/lib/channels";
import { getEntity } from "@/lib/requests";
import { ScrollArea } from "../ui/scroll-area";
import { Cast } from "./cast";
import { getCasts } from "@/lib/requests";
import { MoreCasts } from "./more-casts";
import { ImageCasts } from "./image-casts";

export const CastsTable = async ({
  sort,
  params,
  searchParams,
}: { sort: CastsSort; nav?: React.ReactNode } & CastsQuery) => {
  const page = parseInt(searchParams.page || "1");
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
  const url = params.url
    ? (params.url[params.url.length - 1] === "top"
        ? params.url.slice(0, params.url.length - 1)
        : params.url
      ).join("/")
    : undefined;
  const time =
    sort === CastsSort.Top
      ? searchParams.time || (url ? "all" : "day")
      : undefined;

  let entity;
  if (params.id) {
    entity = await getEntity(params.id, false);
  }

  if (searchParams.display === "images") {
    return (
      <ImageCasts
        sort={sort}
        page={page}
        parentUrl={channel?.parentUrl}
        time={time}
        fid={entity?.fid}
      />
    );
  }

  const casts = await getCasts(
    sort,
    page,
    channel?.parentUrl,
    time,
    entity?.fid,
    true,
    url
  );

  return (
    <>
      <ScrollArea className="hidden md:flex md:h-full">
        <div className="flex flex-col w-full">
          {casts.map((cast, i) => (
            <Cast
              key={cast.hash}
              cast={cast}
              rank={
                sort !== CastsSort.New ? (page - 1) * 25 + i + 1 : undefined
              }
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
            url={url}
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
