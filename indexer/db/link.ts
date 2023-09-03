import prisma from "../lib/prisma";
import { Source } from ".";
import { Link as DBLink } from "@prisma/client";

export interface Link {
  url: string;
  metadata?: any;
  verified: boolean;
  source: Source;
  sourceInput?: string;
}

export const upsertLinks = async (entityId: number, links: Link[]) => {
  const existingLinks = await prisma.link.findMany({
    where: { entityId },
  });

  const existingLinksMap = existingLinks.reduce((acc, link) => {
    acc[link.url] = link;
    return acc;
  }, {} as Record<string, DBLink>);

  // create new links
  const linksToCreate = links.filter((link) => !existingLinksMap[link.url]);

  await prisma.link.createMany({
    data: linksToCreate.map((link) => ({
      ...link,
      entityId,
    })),
  });

  // update links that have changed
  const linksToUpdate = links
    .filter((link) => existingLinksMap[link.url])
    .map((link) => {
      const existingLink = existingLinksMap[link.url];
      return {
        entityId: existingLink.entityId,
        url: existingLink.url,
        source: existingLink.source,
      };
    });

  await prisma.link.updateMany({
    where: {
      OR: linksToUpdate,
    },
    data: {
      deleted: false,
    },
  });

  // soft delete links that are no longer present
  const linksToDelete = existingLinks
    .filter((link) => !links.find((l) => l.url === link.url))
    .map(({ entityId, url, source }) => ({
      entityId,
      url,
      source,
    }));

  await prisma.link.updateMany({
    where: {
      OR: linksToDelete,
    },
    data: {
      deleted: true,
    },
  });
};
