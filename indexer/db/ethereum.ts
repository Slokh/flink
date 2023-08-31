import prisma from "../../lib/prisma";
import { Source } from ".";

export interface Ethereum {
  address: string;
  verified: boolean;
  source: Source;
}

export const getEthereumEntity = async (address: string) => {
  const ethereum = await prisma.ethereum.findFirst({
    where: { address },
  });

  if (!ethereum) {
    return undefined;
  }

  return ethereum.entityId;
};

export const upsertEthereum = async (ethereum: Ethereum, entityId?: number) => {
  let id = entityId || (await getEthereumEntity(ethereum.address));

  if (id) {
    await prisma.ethereum.upsert({
      where: { address: ethereum.address },
      create: {
        ...ethereum,
        entityId: id,
      },
      update: ethereum,
    });
  } else {
    const entity = await prisma.entity.create({
      data: {
        ethereumAccounts: {
          create: [ethereum],
        },
      },
    });
    id = entity.id;
  }

  return id;
};
