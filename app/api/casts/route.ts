import {
  getCastsResponseByHotness,
  getCastsResponseByNewness,
  getCastsResponseByTopLikes,
} from "@/lib/casts";
import { CastsSort, FarcasterCast } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request
): Promise<NextResponse<FarcasterCast[]>> {
  const url = new URL(request.url);
  const fid = url.searchParams.get("fid");
  const fidParsed = fid ? parseInt(fid) : undefined;
  const parentUrl = url.searchParams.get("parentUrl") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const sort = url.searchParams.get("sort") as CastsSort;
  const onlyParents = url.searchParams.get("all") !== "true";
  const urlParsed = url.searchParams.get("url")
    ? decodeURI(url.searchParams.get("url") as string)
    : undefined;
  const query = url.searchParams.get("query")
    ? ` ${decodeURIComponent(url.searchParams.get("query") as string)} `
    : "";

  let response = [];
  if (sort === CastsSort.Home) {
    const viewerFid = url.searchParams.get("viewerFid")
      ? parseInt(url.searchParams.get("viewerFid") as string)
      : undefined;
    response = await getCastsResponseByHotness(
      page,
      onlyParents,
      parentUrl,
      viewerFid
    );
  } else if (sort === CastsSort.Hot) {
    response = await getCastsResponseByHotness(page, onlyParents, parentUrl);
  } else if (sort === CastsSort.Top || sort === CastsSort.TopReplies) {
    const time = url.searchParams.get("time") as
      | "hour"
      | "day"
      | "week"
      | "month"
      | "year"
      | "all";
    response = await getCastsResponseByTopLikes(
      page,
      sort === CastsSort.TopReplies,
      time || "all",
      parentUrl,
      fidParsed,
      urlParsed,
      query
    );
  } else if (sort === CastsSort.New || sort === CastsSort.NewReplies) {
    response = await getCastsResponseByNewness(
      page,
      sort === CastsSort.NewReplies,
      parentUrl,
      fidParsed,
      urlParsed,
      query
    );
  }

  return NextResponse.json(response);
}
