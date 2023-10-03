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

    const users = await prisma.user.findMany({
      where: {
        address: address.toLowerCase(),
        signerStatus: "approved",
      },
    });

    return NextResponse.json({
      users: await Promise.all(users.map(({ fid }) => getUserData(fid!))),
    });
  }
);

const getUserData = async (fid: number) => {
  const [account, likes, recasts, casts, follows, preferences] =
    await Promise.all([
      prisma.farcaster.findFirst({
        where: { fid },
      }),
      prisma.farcasterCastReaction.findMany({
        where: {
          fid,
          reactionType: "like",
          deleted: false,
        },
      }),
      prisma.farcasterCastReaction.findMany({
        where: {
          fid,
          reactionType: "recast",
          deleted: false,
        },
      }),
      prisma.farcasterCast.findMany({
        where: {
          fid,
          deleted: false,
        },
      }),
      prisma.farcasterLink.findMany({
        where: {
          fid,
          deleted: false,
          linkType: "follow",
        },
      }),
      prisma.userPreferences.findFirst({
        where: { fid },
      }),
    ]);

  return {
    fid: account?.fid,
    fname: account?.fname,
    pfp: account?.pfp,
    bio: account?.bio,
    display: account?.display,
    likes: likes.reduce((acc, cur) => {
      acc[cur.targetHash] = true;
      return acc;
    }, {} as Record<string, boolean>),
    recasts: recasts.reduce((acc, cur) => {
      acc[cur.targetHash] = true;
      return acc;
    }, {} as Record<string, boolean>),
    casts: casts.reduce((acc, cur) => {
      acc[cur.hash] = true;
      return acc;
    }, {} as Record<string, boolean>),
    follows: follows.reduce((acc, cur) => {
      acc[cur.targetFid] = true;
      return acc;
    }, {} as Record<string, boolean>),
    preferences: preferences?.preferences || { channels: [] },
  };
};
