import prisma from "../lib/prisma";
import { Source } from ".";

export interface OpenSea {
  address: string;
  username?: string;
  pfp?: string;
  isVerified: boolean;
  verified: boolean;
  source: Source;
}

export const getOpenSeaEntity = async (address: string) => {
  const opensea = await prisma.openSea.findFirst({
    where: { address },
  });

  if (!opensea) {
    return undefined;
  }

  return opensea.entityId;
};

export const upsertOpenSea = async (openSea: OpenSea, entityId?: number) => {
  let id = entityId || (await getOpenSeaEntity(openSea.address));

  if (id) {
    await prisma.openSea.upsert({
      where: { address: openSea.address },
      create: {
        ...openSea,
        entityId: id,
      },
      update: openSea,
    });
  } else {
    const entity = await prisma.entity.create({
      data: {
        openseaAccounts: {
          create: [openSea],
        },
      },
    });
    id = entity.id;
  }

  return id;
};
