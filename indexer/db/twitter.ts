import prisma from "../../lib/prisma";
import { Source } from ".";

export interface Twitter {
  username: string;
  verified: boolean;
  source: Source;
}

export const getTwitterEntity = async (username: string) => {
  const twitter = await prisma.twitter.findFirst({
    where: { username },
  });

  if (!twitter) {
    return undefined;
  }

  return twitter.entityId;
};

export const getTwitterBySource = async (source: string) => {
  return await prisma.twitter.findFirst({
    where: { source },
  });
};

export const upsertTwitter = async (twitter: Twitter, entityId?: number) => {
  let id = entityId || (await getTwitterEntity(twitter.username));

  if (id) {
    await prisma.twitter.upsert({
      where: { username: twitter.username },
      create: {
        ...twitter,
        entityId: id,
      },
      update: twitter,
    });
  } else {
    const entity = await prisma.entity.create({
      data: {
        twitterAccounts: {
          create: [twitter],
        },
      },
    });
    id = entity.id;
  }

  return id;
};
