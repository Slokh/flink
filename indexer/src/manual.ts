import { handleUserUpdate } from "../farcaster/users";
import { getHubClient } from "../farcaster/hub";
import prisma from "../lib/prisma";
import { handleCastMessages } from "../farcaster/casts";

const run = async () => {
  const args = process.argv.slice(2);
  const client = await getHubClient();

  const mode = args[0];
  if (mode === "user") {
    for (const arg of args.slice(1)) {
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
        await handleUserUpdate(client, fid);
      }
    }
  } else if (mode === "cast") {
    const fid = parseInt(args[1], 10);
    const hash = args[2];
    const message = await client.getCast(fid, hash);
    if (message) {
      await handleCastMessages(client, [message]);
    }
  }
};

run();
