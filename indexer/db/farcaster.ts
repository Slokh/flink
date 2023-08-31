import prisma from "../lib/prisma";
import { Source } from ".";

export interface Farcaster {
  fid: number;
  fname?: string;
  display?: string;
  pfp?: string;
  bio?: string;
  verified: boolean;
  source: Source;
}

export const getFarcasterEntity = async (fid: number) => {
  const farcaster = await prisma.farcaster.findFirst({
    where: { fid },
  });

  if (!farcaster) {
    return undefined;
  }

  return farcaster.entityId;
};

export const upsertFarcaster = async (
  farcaster: Farcaster,
  entityId?: number
) => {
  let id = entityId || (await getFarcasterEntity(farcaster.fid));

  if (id) {
    await prisma.farcaster.upsert({
      where: { fid: farcaster.fid },
      create: {
        ...farcaster,
        entityId: id,
      },
      update: farcaster,
    });
  } else {
    const entity = await prisma.entity.create({
      data: {
        farcasterAccounts: {
          create: [farcaster],
        },
      },
    });
    id = entity.id;
  }

  return id;
};
