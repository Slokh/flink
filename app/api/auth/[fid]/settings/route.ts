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

    //   const data = await fetch("https://api.neynar.com/v2/farcaster/cast", {
    //     method: "POST",
    //     headers: {
    //       "content-type": "application/json",
    //       api_key: process.env.NEYNAR_API_KEY as string,
    //     },
    //     body: JSON.stringify({
    //       signer_uuid: signer.signerUuid,
    //       ...(await request.json()),
    //     }),
    //   });

    //   const res = await data.json();

    //   if (!data.ok) {
    //     return NextResponse.json({
    //       status: data.status,
    //       statusText: data.statusText,
    //       error: res,
    //     });
    //   }

    console.log(await request.json());

    return NextResponse.json({});
  }
);
