import { getHubClient } from "@/indexer/farcaster/hub";
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

    if (!params.fid) {
      return NextResponse.json(
        {
          status: 400,
          statusText: "Bad Request",
          error: "Missing fid",
        },
        { status: 400 }
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

    if (body.username) {
      const client = await getHubClient();
      let tries = 0;
      do {
        const proof = await client.client.getUsernameProof({
          name: Uint8Array.from(Buffer.from(body.username)),
        });
        if (proof.isOk()) {
          break;
        }

        if (tries >= 5) {
          return NextResponse.json(
            {
              status: 500,
              statusText: "Internal Server Error",
              error: "Failed to get username proof.",
            },
            { status: 500 }
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        tries++;
      } while (true);
    }

    const data = await fetch("https://api.neynar.com/v2/farcaster/user", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        api_key: process.env.NEYNAR_API_KEY as string,
      },
      body: JSON.stringify({
        signer_uuid: signer.signerUuid,
        ...body,
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

    return NextResponse.json({});
  }
);
