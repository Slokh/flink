import { CONTRACTS } from "@/lib/contracts";
import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { optimism, optimismGoerli } from "viem/chains";

const client = createPublicClient({
  chain: CONTRACTS.NETWORK === 10 ? optimism : optimismGoerli,
  transport:
    CONTRACTS.NETWORK === 10
      ? http(process.env.OPTIMISM_RPC_URL as string)
      : http(process.env.OPTIMISM_GOERLI_RPC_URL as string),
});

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

    const mappedUsers = await Promise.all(
      users.map(({ fid }) => getUserData(fid!))
    );
    const primaryUser = await getPrimaryUser(address as `0x${string}`);

    return NextResponse.json({
      users: mappedUsers,
      primary: primaryUser
        ? {
            ...primaryUser,
            requiresSigner:
              primaryUser && !users.some(({ fid }) => fid === primaryUser?.fid),
          }
        : undefined,
    });
  }
);

const getPrimaryUser = async (address: `0x${string}`) => {
  const fid = await client.readContract({
    address: CONTRACTS.ID_REGISTRY_ADDRESS,
    abi: [parseAbiItem("function idOf(address owner) view returns (uint256)")],
    functionName: "idOf",
    args: [address],
  });
  if (!fid) return;

  const account = await prisma.farcaster.findFirst({
    where: { fid: Number(fid) },
  });
  if (!account) return;

  return {
    fid: account?.fid,
    fname: account?.fname,
    pfp: account?.pfp,
    bio: account?.bio,
    display: account?.display,
  };
};

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
