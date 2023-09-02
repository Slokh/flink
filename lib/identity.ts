import { isAddress } from "viem";
import prisma from "./prisma";
import { getAddressForENS } from "./ens";
import { getAddressFromLensHandle } from "@/indexer/links/lens";

type Identity = {
  input: string;
  entityId?: number;
  address?: string;
};

export const getIdentityForInput = async (input: string) => {
  const address = await getAddressFromInput(input);
  const entityId = await getEntityId(input, address);
  return {
    input,
    entityId,
    address,
  } as Identity;
};

const getEntityId = async (input: string, address?: string) => {
  let entity;
  if (address) {
    entity = await prisma.ethereum.findFirst({
      where: { address: address.toLowerCase() },
      select: { entityId: true },
    });
    if (entity?.entityId) {
      return entity.entityId;
    }
  }

  entity = await prisma.farcaster.findFirst({
    where: { fname: input },
    select: { entityId: true },
  });
  if (entity?.entityId) {
    return entity.entityId;
  }

  entity = await prisma.link.findFirst({
    where: {
      url: `twitter.com/${input}`,
    },
    select: { entityId: true },
  });
  if (entity?.entityId) {
    return entity.entityId;
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
