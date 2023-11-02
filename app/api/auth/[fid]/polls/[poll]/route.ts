import { getCastsByFidHashes, getCastsResponse } from "@/lib/casts";
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

    const pollId = parseInt(params.poll as string);
    const poll = await prisma.poll.findFirst({
      where: { id: pollId, fid },
    });
    if (!poll) {
      return NextResponse.json(
        {
          status: 404,
          statusText: "Not Found",
          error: "Poll not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    await prisma.poll.update({
      where: {
        id: pollId,
      },
      data: {
        hash: body.hash,
      },
    });

    return NextResponse.json({
      poll: poll.id,
    });
  }
);
