import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    const data = await fetch(
      "https://api.neynar.com/v2/farcaster/user/follow",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          api_key: process.env.NEYNAR_API_KEY as string,
        },
        body: JSON.stringify({
          signer_uuid: signer.signerUuid,
          ...(await request.json()),
        }),
      }
    );

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

    const data = await fetch(
      "https://api.neynar.com/v2/farcaster/user/follow",
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          api_key: process.env.NEYNAR_API_KEY as string,
        },
        body: JSON.stringify({
          signer_uuid: signer.signerUuid,
          ...(await request.json()),
        }),
      }
    );

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
