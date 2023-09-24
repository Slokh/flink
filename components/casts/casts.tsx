/* eslint-disable @next/next/no-img-element */
import { headers } from "next/headers";
import { FarcasterCast, CastsSort, CastsQuery } from "@/lib/types";
import { Cast } from "./cast";
import {
  CastsNavigation,
  CastsPagination,
  UserCastsNavigation,
} from "./casts-navigation";
import { CHANNELS_BY_ID } from "@/lib/channels";
import { getEntity } from "@/lib/requests";
import { ScrollArea } from "../ui/scroll-area";

const getCasts = async (
  sort: CastsSort,
  page: number,
  parentUrl?: string,
  time?: string,
  fid?: number
): Promise<FarcasterCast[]> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/casts?sort=${sort}${
      parentUrl ? `&parentUrl=${parentUrl}` : ""
    }${time ? `&time=${time}` : ""}${fid ? `&fid=${fid}` : ""}${
      page ? `&page=${page}` : ""
    }`
  );
  return await data.json();
};

export const Casts = async ({
  sort,
  parentUrl,
  time,
  fid,
  page,
}: {
  sort: CastsSort;
  parentUrl?: string;
  time?: string;
  fid?: number;
  page: number;
}) => {
  const casts = await getCasts(sort, page, parentUrl, time, fid);
  return (
    <div className="w-full">
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
    </div>
  );
};

export const CastsTable = async ({
  sort,
  params,
  searchParams,
}: { sort: CastsSort } & CastsQuery) => {
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

  return (
    <div className="flex flex-col w-full h-full flex-grow">
      <div className="flex flex-row items-center justify-between p-2 border-b">
        <div></div>
        <CastsNavigation selected={sort} time={time} channel={channelId} />
      </div>
      <ScrollArea className="h-full">
        <Casts
          sort={sort}
          time={time}
          page={page}
          parentUrl={channel?.parentUrl}
        />
        <CastsPagination href={baseHref} page={page} />
      </ScrollArea>
    </div>
  );
};

export const UserCastsTable = async ({
  sort,
  params,
  searchParams,
}: { sort: CastsSort } & CastsQuery) => {
  const entity = await getEntity(params.id, false);
  const page = parseInt(searchParams.page || "1");
  const time = sort === CastsSort.Top ? searchParams.time || "all" : undefined;

  let baseHref = `/${params.id}/`;
  if (sort !== CastsSort.Hot) {
    baseHref += sort.toLowerCase();
    if (sort === CastsSort.Top) {
      baseHref += `?time=${time}`;
    }
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row items-center justify-between p-2">
        <div></div>
        <UserCastsNavigation selected={sort} time={time} id={params.id} />
      </div>
      <Casts sort={sort} time={time} fid={entity.fid} page={page} />
      <CastsPagination href={baseHref} page={page} />
    </div>
  );
};
