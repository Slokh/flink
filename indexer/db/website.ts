import prisma from "../lib/prisma";
import { Source } from ".";

export interface Website {
  url: string;
  verified: boolean;
  source: Source;
}

export const upsertWebsite = async (website: Website, entityId: number) => {
  await prisma.website.upsert({
    where: { url_entityId: { entityId, url: website.url } },
    create: {
      ...website,
      entityId,
    },
    update: website,
  });

  return entityId;
};
