import {
  getCastsResponseByHotness,
  getCastsResponseByNewness,
  getCastsResponseByTopLikes,
} from "@/lib/casts";
import { CHANNELS_BY_ID } from "@/lib/channels";
import { CastsSort, FarcasterCast } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request
): Promise<NextResponse<FarcasterCast[]>> {
  const url = new URL(request.url);
  const fid = url.searchParams.get("fid");
  const fidParsed = fid ? parseInt(fid) : undefined;
  const community = url.searchParams.get("community");
  const page = parseInt(url.searchParams.get("page") || "1");
  const sort = url.searchParams.get("sort") as CastsSort;

  const parentUrl = community
    ? CHANNELS_BY_ID[community]?.parentUrl
    : undefined;

  if (sort === CastsSort.Hot) {
    return NextResponse.json(
      await getCastsResponseByHotness(page, parentUrl, fidParsed)
    );
  } else if (sort === CastsSort.Top || sort === CastsSort.TopReplies) {
    const time = url.searchParams.get("time") as
      | "hour"
      | "day"
      | "week"
      | "month"
      | "year"
      | "all";
    return NextResponse.json(
      await getCastsResponseByTopLikes(
        page,
        sort === CastsSort.TopReplies,
        time || "all",
        parentUrl,
        fidParsed
      )
    );
  } else if (sort === CastsSort.New || sort === CastsSort.NewReplies) {
    return NextResponse.json(
      await getCastsResponseByNewness(
        page,
        sort === CastsSort.NewReplies,
        parentUrl,
        fidParsed
      )
    );
  }

  return NextResponse.json([]);
}
