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

    const body = await request.json();
    await prisma.userSavedCasts.upsert({
      where: {
        address_fid_targetFid_targetHash: {
          address: address.toLowerCase(),
          fid,
          targetFid: body.targetFid,
          targetHash: body.targetHash,
        },
      },
      create: {
        address: address.toLowerCase(),
        fid,
        targetFid: body.targetFid,
        targetHash: body.targetHash,
        topParentUrl: body.topParentUrl,
        tag: body.tag,
      },
      update: {
        tag: body.tag,
      },
    });

    return NextResponse.json({});
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

    const body = await request.json();
    await prisma.userSavedCasts.delete({
      where: {
        address_fid_targetFid_targetHash: {
          address: address.toLowerCase(),
          fid,
          targetFid: body.targetFid,
          targetHash: body.targetHash,
        },
      },
    });

    return NextResponse.json({});
  }
);

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

    const savedCasts = await prisma.userSavedCasts.findMany({
      where: {
        address: address.toLowerCase(),
        fid,
      },
    });

    const fidHashes = savedCasts.map(({ targetFid, targetHash }) => ({
      fid: targetFid,
      hash: targetHash,
    }));
    const casts = await getCastsByFidHashes(fidHashes);

    return NextResponse.json({
      casts: await getCastsResponse(casts),
    });
  }
);
