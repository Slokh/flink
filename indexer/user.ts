import { FarcasterUser } from "@/lib/hub";
import prisma from "../lib/prisma";
import { TwitterInfo, TwitterSources, fetchTwitterInfo } from "./twitter";

export const handleFarcasterUser = async (user: FarcasterUser) => {
  const { fid, fname, bio, addresses } = user;

  await upsertUser(user);

  if (!addresses?.length) {
    console.log(fid, undefined, fname, undefined);
    return;
  }

  let twitterInfo: TwitterInfo | undefined;

  for (const address of addresses) {
    await upsertAddress(fid, address);

    if (twitterInfo) {
      continue;
    }

    const record = await prisma.reputation.findFirst({
      where: { address },
    });

    if (record) {
      twitterInfo = {
        twitterUsername: record.twitterUsername,
        twitterSource: record.twitterSource as TwitterSources,
      };
      continue;
    }

    twitterInfo = await fetchTwitterInfo(address, bio);
  }

  for (const address of addresses) {
    if (twitterInfo) {
      console.log(fid, address, fname, twitterInfo);
      await upsertReputation(address, twitterInfo);
    } else {
      console.log(fid, address, fname, undefined);
    }
  }
};

const upsertUser = async ({ fid, fname, pfp, display, bio }: FarcasterUser) => {
  await prisma.user.upsert({
    where: { fid },
    create: {
      fid,
      fname,
      pfp,
      display,
      bio,
    },
    update: {
      fname,
      pfp,
      display,
      bio,
    },
  });
};

const upsertAddress = async (fid: number, address: string) => {
  await prisma.address.upsert({
    where: { fid_address: { fid, address } },
    create: {
      fid,
      address,
    },
    update: {},
  });
};

const upsertReputation = async (address: string, twitterInfo: TwitterInfo) => {
  await prisma.reputation.upsert({
    where: { address },
    create: {
      address,
      twitterUsername: twitterInfo.twitterUsername,
      twitterSource: twitterInfo.twitterSource,
    },
    update: {
      twitterUsername: twitterInfo.twitterUsername,
      twitterSource: twitterInfo.twitterSource,
    },
  });
};
