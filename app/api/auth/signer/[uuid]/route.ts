import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET: RouteHandlerWithSession = ironSessionWrapper(
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
        signerUuid: params.uuid as string,
      },
    });
    if (!user) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    if (user.fid) {
      return NextResponse.json({
        signerUuid: user.signerUuid,
        signerStatus: user.signerStatus,
        signerPublicKey: user.signerPublicKey,
        signerApprovalUrl: user.signerApprovalUrl,
        fid: user.fid,
      });
    }

    const data = await fetch(
      `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${user.signerUuid}`,
      {
        method: "GET",
        headers: {
          api_key: process.env.NEYNAR_API_KEY as string,
        },
        cache: "no-store",
      }
    );
    const signer = await data.json();

    await prisma.user.update({
      where: {
        address_signerUuid: {
          address: address.toLowerCase(),
          signerUuid: signer.signer_uuid,
        },
      },
      data: {
        signerUuid: signer.signer_uuid,
        signerStatus: signer.status,
        signerPublicKey: signer.public_key,
        signerApprovalUrl: signer.signer_approval_url,
        fid: signer.fid,
      },
    });

    return NextResponse.json({
      signerUuid: signer.signer_uuid,
      signerStatus: signer.status,
      signerPublicKey: signer.public_key,
      signerApprovalUrl: signer.signer_approval_url,
      fid: signer.fid,
    });
  }
);
