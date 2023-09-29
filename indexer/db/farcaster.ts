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

export interface FarcasterLink {
  fid: number;
  linkType: string;
  targetFid: number;
  timestamp: Date;
  displayTimestamp?: Date;
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
    let triesLeft = 5;
    do {
      const entity = await prisma.entity.create({
        data: {
          farcasterAccounts: {
            create: [farcaster],
          },
        },
      });
      id = entity.id;
      triesLeft--;
    } while (!id && triesLeft > 0);
  }

  return id;
};

export const upsertFarcasterLinks = async (links: FarcasterLink[]) => {
  for (let i = 0; i < links.length; i += 5000) {
    const batch = links.slice(i, i + 5000);
    await prisma.farcasterLink.updateMany({
      where: {
        OR: batch.map((link) => ({
          fid: link.fid,
          linkType: link.linkType,
          targetFid: link.targetFid,
          deleted: true,
        })),
      },
      data: {
        deleted: false,
      },
    });
    await prisma.farcasterLink.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
};

export const deleteFarcasterLink = async (link: FarcasterLink) => {
  await prisma.farcasterLink.upsert({
    where: {
      linkType_fid_targetFid: {
        fid: link.fid,
        targetFid: link.targetFid,
        linkType: link.linkType,
      },
    },
    create: {
      ...link,
      deleted: true,
    },
    update: { deleted: true },
  });
};
