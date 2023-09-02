import prisma from "../lib/prisma";
import { Source } from ".";

export interface Link {
  url: string;
  metadata?: any;
  verified: boolean;
  source: Source;
  sourceInput?: string;
}

export const upsertLinks = async (entityId: number, links: Link[]) => {
  await prisma.link.deleteMany({
    where: { entityId },
  });

  await prisma.link.createMany({
    data: links.map((link) => ({
      ...link,
      entityId,
    })),
  });
};
