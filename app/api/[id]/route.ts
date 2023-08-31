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
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let address;
  if (id.includes(".")) {
    address = await client.getEnsAddress({
      name: id,
    });
  } else if (id.startsWith("0x") && isAddress(id)) {
    address = id;
  }

  let entityId;
  if (address) {
    const entity = await prisma.ethereum.findFirst({
      where: { address: address.toLowerCase() },
      select: { entityId: true },
    });
    entityId = entity?.entityId;
  }

  if (!entityId) {
    const entity = await prisma.farcaster.findFirst({
      where: { fname: id },
      select: { entityId: true },
    });
    entityId = entity?.entityId;

    if (!entityId) {
      const entity = await prisma.twitter.findFirst({
        where: { username: id },
        select: { entityId: true },
      });
      entityId = entity?.entityId;
    }
  }

  if (!entityId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const entity = await getEntity(entityId);

  return NextResponse.json(entity);
}

const getEntity = async (entityId: number) => {
  const farcasterAccounts = await getEntityFarcasterAccounts(entityId);
  const twitterAccounts = await getEntityTwitterAccounts(entityId);
  const ethereumAccounts = await getEntityEthereumAccounts(entityId);

  return {
    farcasterAccounts,
    twitterAccounts,
    ethereumAccounts,
  };
};

const getEntityFarcasterAccounts = async (entityId: number) => {
  const farcasterAccounts = await prisma.farcaster.findMany({
    where: { entityId },
  });

  return farcasterAccounts.map((farcasterAccount) => ({
    fid: farcasterAccount.fid,
    fname: farcasterAccount.fname,
    display: farcasterAccount.display,
    pfp: farcasterAccount.pfp,
    bio: farcasterAccount.bio,
  }));
};

const getEntityTwitterAccounts = async (entityId: number) => {
  const twitterAccounts = await prisma.twitter.findMany({
    where: { entityId },
  });

  return twitterAccounts.map((twitterAccount) => twitterAccount.username);
};

const getEntityEthereumAccounts = async (entityId: number) => {
  const ethereumAccounts = await prisma.ethereum.findMany({
    where: { entityId },
  });

  const addresses = ethereumAccounts.map(
    (ethereumAccount) => ethereumAccount.address
  );

  const ensNames = await Promise.all(
    addresses.map((address) =>
      client.getEnsName({ address: address as `0x${string}` })
    )
  );

  return addresses.map((address, i) => ({
    address,
    ensName: ensNames[i] || undefined,
  }));
};
