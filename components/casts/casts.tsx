/* eslint-disable @next/next/no-img-element */
import { headers } from "next/headers";
import { FarcasterCast, CastsSort, CastsQuery } from "@/lib/types";
import { Cast } from "./cast";
import { ChannelSelect } from "../channel-select";
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
  community?: string,
  time?: string,
  fid?: number
): Promise<FarcasterCast[]> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/casts?sort=${sort}${
      community ? `&community=${community}` : ""
    }${time ? `&time=${time}` : ""}${fid ? `&fid=${fid}` : ""}${
      page ? `&page=${page}` : ""
    }`
  );
  return await data.json();
};

export const Casts = async ({
  sort,
  community,
  time,
  fid,
  page,
}: {
  sort: CastsSort;
  community?: string;
  time?: string;
  fid?: number;
  page: number;
}) => {
  const casts = await getCasts(sort, page, community, time, fid);
  return (
    <div>
      {casts.map((cast, i) => (
        <Cast
          key={cast.hash}
          cast={cast}
          rank={i + 1}
          showRank={sort !== CastsSort.New}
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
    ? CHANNELS_BY_ID[params.channel]?.channelId
    : undefined;

  let baseHref = "/";
  if (channel) {
    baseHref += `channel/${channel}/`;
  }
  if (sort !== CastsSort.Hot) {
    baseHref += sort.toLowerCase();
    if (sort === CastsSort.Top) {
      baseHref += `?time=${time}`;
    }
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-row items-center justify-between p-2 border-b">
        <ChannelSelect channel={channel} />
        <CastsNavigation selected={sort} time={time} community={channel} />
      </div>
      <ScrollArea className="h-full">
        <Casts sort={sort} time={time} page={page} community={channel} />
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
  const time = sort === CastsSort.Top ? searchParams.time || "day" : undefined;

  let baseHref = `/${params.id}/`;
  if (sort !== CastsSort.Hot) {
    baseHref += sort.toLowerCase();
    if (sort === CastsSort.Top) {
      baseHref += `?time=${time}`;
    }
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-row items-center justify-between p-2">
        <div></div>
        <UserCastsNavigation selected={sort} id={params.id} />
      </div>
      <ScrollArea className="h-full">
        <Casts sort={sort} fid={entity.fid} page={page} />
        <CastsPagination href={baseHref} page={page} />
      </ScrollArea>
    </div>
  );
};
