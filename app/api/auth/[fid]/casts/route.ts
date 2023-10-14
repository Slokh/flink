import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST: RouteHandlerWithSession = ironSessionWrapper(
  async (request, { params }) => {
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

    const fid = parseInt(params.fid as string);
    const signer = await prisma.user.findFirst({
      where: { address: address.toLowerCase(), fid },
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

    const body = await request.json();
    const casts = [];
    let parent = body.casts[0].parent;
    for (const cast of body.casts) {
      const data = await fetch("https://api.neynar.com/v2/farcaster/cast", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          api_key: process.env.NEYNAR_API_KEY as string,
        },
        body: JSON.stringify({
          signer_uuid: signer.signerUuid,
          ...cast,
          parent,
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

      casts.push(res);
      parent = res.cast.hash;

      while (true) {
        const found = await prisma.farcasterCast.findFirst({
          where: { hash: parent },
        });
        if (found) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return NextResponse.json({ casts });
  }
);

export const DELETE: RouteHandlerWithSession = ironSessionWrapper(
  async (request, { params }) => {
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

    const fid = parseInt(params.fid as string);
    const signer = await prisma.user.findFirst({
      where: { address: address.toLowerCase(), fid },
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
