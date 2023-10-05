import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getFidForAddress } from "../../[fid]/signers/route";

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

    const fid = await getFidForAddress(address as `0x${string}`);
    if (fid === BigInt(0)) {
      return NextResponse.json({ transferRequests: [] });
    }

    const transferRequests = await prisma.farcasterTransferRequests.findMany({
      where: {
        fid: Number(fid),
        to: {
          not: address.toLowerCase(),
        },
      },
    });

    return NextResponse.json({
      transferRequests: transferRequests.map((request) => ({
        to: request.to,
        fid: request.fid,
        signature: request.signature,
        deadline: request.deadline,
        fname: request.fname,
      })),
    });
  }
);
