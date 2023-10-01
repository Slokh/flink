import {
  getCastsResponseByHotness,
  getCastsResponseByNewness,
  getCastsResponseByTopLikes,
} from "@/lib/casts";
import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
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

  let response = [];
  if (sort === CastsSort.Hot) {
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
      fidParsed
    );
  } else if (sort === CastsSort.New || sort === CastsSort.NewReplies) {
    response = await getCastsResponseByNewness(
      page,
      sort === CastsSort.NewReplies,
      parentUrl,
      fidParsed
    );
  }

  return NextResponse.json(response);
}

export const POST: RouteHandlerWithSession = ironSessionWrapper(
  async (request) => {
    const address = request.session.siwe?.data.address;
    if (!address) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const signer = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    });
    if (!signer?.signerUuid) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const data = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        api_key: process.env.NEYNAR_API_KEY as string,
      },
      body: JSON.stringify({
        signer_uuid: signer.signerUuid,
        ...(await request.json()),
      }),
    });

    const res = await data.json();

    if (!data.ok) {
      return NextResponse.json({
        status: data.status,
        statusText: data.statusText,
        error: res,
      });
    }

    const { cast } = await res;

    return NextResponse.json(cast);
  }
);

export const DELETE: RouteHandlerWithSession = ironSessionWrapper(
  async (request) => {
    const address = request.session.siwe?.data.address;
    if (!address) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const signer = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    });
    if (!signer?.signerUuid) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const data = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        api_key: process.env.NEYNAR_API_KEY as string,
      },
      body: JSON.stringify({
        signer_uuid: signer.signerUuid,
        ...(await request.json()),
      }),
    });

    if (!data.ok) {
      return NextResponse.json({
        status: data.status,
        statusText: data.statusText,
        error: await data.json(),
      });
    }

    return NextResponse.json({});
  }
);
