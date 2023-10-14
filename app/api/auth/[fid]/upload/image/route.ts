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
    const res = await fetch("https://imgur-apiv3.p.rapidapi.com/3/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Client-ID 2c72c9f7fc84329",
        "X-RapidApi-Key": "0bb3ce13d0msh95902c15e7eb132p153594jsn33b6ad91d004",
      },
      body: JSON.stringify({ image: body.image }),
    });
    return NextResponse.json(await res.json());
  }
);
