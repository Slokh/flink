import {
  backfillFarcasterUsers,
  watchFarcasterUsers,
  runFarcasterManual,
} from "../farcaster/users";
import { getHubClient } from "../farcaster/hub";
import prisma from "../lib/prisma";

const run = async () => {
  const args = process.argv.slice(2);
  const mode = process.env.MODE;
  const client = await getHubClient();

  if (args.length === 0) {
    if (mode === "backfill") {
      await backfillFarcasterUsers(client);
    } else if (mode === "live") {
      await watchFarcasterUsers(client);
    }
  } else {
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
        await runFarcasterManual(client, fid);
      }
    }
  }
};

run();
