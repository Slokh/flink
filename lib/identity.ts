import { isAddress } from "viem";
import prisma from "./prisma";
import { getAddressForENS } from "./ens";
import { getAddressFromLensHandle } from "@/indexer/links/lens";
import { getHubClient } from "@/indexer/farcaster/hub";
import { handleUserUpdate } from "@/indexer/farcaster/users";

type Identity = {
  input: string;
  entityId?: number;
  fid?: number;
  address?: string;
};

export const getIdentityForInput = async (input: string, create: boolean) => {
  const address = await getAddressFromInput(input.toLowerCase());
  const entityId = await getEntityId(input.toLowerCase(), create, address);

  return {
    input,
    address,
    ...entityId,
  } as Identity;
};

const getEntityId = async (
  input: string,
  create: boolean,
  address?: string
) => {
  let entity;
  if (address) {
    entity = await prisma.ethereum.findFirst({
      where: { address: address.toLowerCase() },
      select: { entityId: true },
    });
    if (entity?.entityId) {
      return { entityId: entity.entityId };
    }
  }

  entity = await prisma.farcaster.findFirst({
    where: { fname: input },
    select: { entityId: true, fid: true },
  });
  if (entity?.entityId) {
    return { entityId: entity.entityId, fid: entity.fid };
  }

  entity = await prisma.link.findFirst({
    where: {
      url: `twitter.com/${input}`,
    },
    select: { entityId: true },
  });
  if (entity?.entityId) {
    return { entityId: entity.entityId };
  }

  if (create) {
    const username = await (
      await fetch(
        `https://api.neynar.com/v1/farcaster/user-by-username/?api_key=${process.env.NEYNAR_API_KEY}&username=${input}`
      )
    ).json();

    if (username?.result?.user?.fid) {
      const entityId = await handleUserUpdate(
        await getHubClient(),
        parseInt(username.result.user.fid, 10)
      );
      if (entityId) {
        return { entityId: entityId };
      }
    }
  }
};

const getAddressFromInput = async (input: string) => {
  if (input.endsWith(".lens")) {
    return await getAddressFromLensHandle(input);
  } else if (input.includes(".")) {
    return await getAddressForENS(input);
  } else if (input.startsWith("0x") && isAddress(input)) {
    return input;
  }
};
