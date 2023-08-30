import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPublicClient, http, isAddress } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_RPC_ENDPOINT as string),
});

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  let response: any;
  if (username.startsWith("0x") && isAddress(username)) {
    response = await getInfoForAddress(username);
  } else if (username.includes(".")) {
    response = await getInfoForENS(username);
  } else {
    response = await getInfoForUsername(username);
  }

  if (response.error) {
    return NextResponse.json(response, { status: 404 });
  }

  return NextResponse.json(response);
}

const getInfoForFid = async (fid: number) => {
  const userData = await prisma.user.findUnique({
    where: { fid },
  });

  const addressData = await prisma.address.findMany({
    where: { fid },
  });

  const addresses = addressData.map(({ address }) => address.toLowerCase());
  const addressInfo = await getInfoForAddresses(addresses);

  return {
    fid,
    fname: userData?.fname,
    pfp: userData?.pfp,
    bio: userData?.bio,
    display: userData?.display,
    ...addressInfo,
  };
};

const getInfoForAddresses = async (addresses: string[]) => {
  const reputationData = await prisma.reputation.findFirst({
    where: { address: { in: addresses } },
  });

  const ensNames = (
    await Promise.all(
      addresses.map((address) =>
        client.getEnsName({ address: address as `0x${string}` })
      )
    )
  ).filter(Boolean);

  return {
    addresses,
    ensNames,
    twitterUsername: reputationData?.twitterUsername,
  };
};

const getInfoForAddress = async (address: string) => {
  const addressResult = await prisma.address.findFirst({
    where: {
      address: {
        equals: address,
        mode: "insensitive",
      },
    },
    select: { fid: true },
  });

  if (!addressResult?.fid) {
    return await getInfoForAddresses([address]);
  }

  return await getInfoForFid(addressResult?.fid);
};

const getInfoForENS = async (ensName: string) => {
  const address = await client.getEnsAddress({
    name: ensName,
  });

  if (!address) {
    return getInfoForUsername(ensName);
  }

  return getInfoForAddress(address.toLowerCase());
};

const getInfoForUsername = async (username: string) => {
  const userData = await prisma.user.findFirst({
    where: {
      fname: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: { fid: true },
  });

  if (!userData?.fid) {
    const reputationData = await prisma.reputation.findFirst({
      where: {
        twitterUsername: {
          equals: username,
          mode: "insensitive",
        },
      },
    });
    if (!reputationData?.address) {
      return { error: "User not found" };
    }

    return getInfoForAddress(reputationData?.address);
  }

  return await getInfoForFid(userData.fid);
};
