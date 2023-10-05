import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getActiveSigners } from "../../../[fid]/signers/route";

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

    const user = await prisma.user.findFirst({
      where: {
        address: address.toLowerCase(),
        signerPublicKey: params.key as string,
        signerStatus: "approved",
      },
    });
    if (!user?.fid) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const signers = await getActiveSigners(BigInt(user.fid));
    if (signers[user.signerPublicKey]) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: {
        address_signerUuid: {
          address: user.address,
          signerUuid: user.signerUuid,
        },
      },
      data: {
        signerStatus: "revoked",
      },
    });

    return NextResponse.json({});
  }
);
