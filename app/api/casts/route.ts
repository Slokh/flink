import {
	getCastsResponseByHotness,
	getCastsResponseByNewness,
	getCastsResponseByTopLikes,
} from "@/lib/casts";
import { CastsSort, FarcasterCast } from "@/lib/types";
import { NextResponse } from "next/server";
import { cache } from "react";

export const revalidate = 60;

export async function GET(
	request: Request,
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
		? (url.searchParams.get("query") as string).length > 5
			? decodeURIComponent(url.searchParams.get("query") as string)
			: ` ${decodeURIComponent(url.searchParams.get("query") as string)} `
		: "";

	let response = [];
	if (sort === CastsSort.Home) {
		const viewerFid = url.searchParams.get("viewerFid")
			? parseInt(url.searchParams.get("viewerFid") as string)
			: undefined;
		response = await getCachedResponseByHotness(
			page,
			onlyParents,
			parentUrl,
			viewerFid,
		);
	} else if (sort === CastsSort.Hot) {
		response = await getCachedResponseByHotness(page, onlyParents, parentUrl);
	} else if (sort === CastsSort.Top || sort === CastsSort.TopReplies) {
		const time = url.searchParams.get("time") as
			| "hour"
			| "day"
			| "week"
			| "month"
			| "year"
			| "all";
		response = await getCachedResponseByTopLikes(
			page,
			sort === CastsSort.TopReplies,
			time || "all",
			parentUrl,
			fidParsed,
			urlParsed,
			query,
		);
	} else if (sort === CastsSort.New || sort === CastsSort.NewReplies) {
		response = await getCastsResponseByNewness(
			page,
			sort === CastsSort.NewReplies,
			parentUrl,
			fidParsed,
			urlParsed,
			query,
		);
	}

	return NextResponse.json(response);
}

const getCachedResponseByHotness = cache(
	async (
		page: number,
		onlyParents: boolean,
		parentUrl?: string,
		viewerFid?: number,
	) => {
		return await getCastsResponseByHotness(
			page,
			onlyParents,
			parentUrl,
			viewerFid,
		);
	},
);

const getCachedResponseByTopLikes = cache(
	async (
		page: number,
		onlyParents: boolean,
		time: "hour" | "day" | "week" | "month" | "year" | "all",
		parentUrl?: string,
		fid?: number,
		url?: string,
		query?: string,
	) => {
		return await getCastsResponseByTopLikes(
			page,
			onlyParents,
			time,
			parentUrl,
			fid,
			url,
			query,
		);
	},
);
