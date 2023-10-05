import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET: RouteHandlerWithSession = ironSessionWrapper(
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

    const transferRequest = await prisma.farcasterTransferRequests.findUnique({
      where: {
        to: address.toLowerCase(),
      },
    });
    if (transferRequest) {
      return NextResponse.json({
        transferRequest: {
          to: transferRequest.to,
          fid: transferRequest.fid,
          signature: transferRequest.signature,
          deadline: transferRequest.deadline,
          fname: transferRequest.fname,
        },
      });
    }

    return NextResponse.json({ transferRequest: undefined });
  }
);

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

    const body: {
      fid: number;
      signature: string;
      deadline: number;
      fname: string;
    } = await request.json();
    await prisma.farcasterTransferRequests.upsert({
      where: {
        to: address.toLowerCase(),
      },
      create: {
        to: address.toLowerCase(),
        fid: body.fid,
        signature: body.signature,
        deadline: body.deadline,
        fname: body.fname,
      },
      update: {
        fid: body.fid,
        signature: body.signature,
        deadline: body.deadline,
        fname: body.fname,
      },
    });

    return NextResponse.json({});
  }
);
