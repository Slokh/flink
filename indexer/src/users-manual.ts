import { handleFidUserUpdate } from "../farcaster/users";
import { getHubClient } from "../farcaster/hub";
import prisma from "../lib/prisma";

const run = async () => {
  const args = process.argv.slice(2);
  const client = await getHubClient();

  for (const arg of args) {
    let fid;
    if (arg.startsWith("e")) {
      const record = await prisma.farcaster.findFirst({
        where: { entityId: parseInt(arg.slice(1), 10) },
        select: { fid: true },
      });
      fid = record?.fid;
    } else {
      fid = parseInt(arg, 10);
    }

    if (fid) {
      await handleFidUserUpdate("manual", client, fid);
    }
  }
};

run();
