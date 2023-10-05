import { handleUserUpdate } from "../farcaster/users";
import { Client, convertToHex, getHubClient } from "../farcaster/hub";
import { handleCastMessages } from "../farcaster/casts";
import prisma from "../lib/prisma";

const run = async () => {
  const args = process.argv.slice(2);
  const client = await getHubClient();

  const mode = args[0];
  if (mode === "user") {
    const fid = parseInt(args[1], 10);
    await handleUserUpdate(client, fid);
    await handleFidCasts(client, fid);
  } else if (mode === "cast") {
    const fid = parseInt(args[1], 10);
    const hash = args[2];
    const message = await client.getCast(fid, hash);
    if (message) {
      await handleCastMessages(client, [message], false, false);
    }
  }
};

run();

const handleFidCasts = async (client: Client, fid: number) => {
  let pageToken: Uint8Array | undefined = undefined;
  const hashes = [];
  do {
    const response = await client.client.getCastsByFid({
      fid,
      pageToken,
    });
    if (response.isOk()) {
      const messages = response.value.messages;
      await handleCastMessages(client, messages, false, false);
      hashes.push(...messages.map((m) => convertToHex(m.hash)));

      pageToken = response.value.nextPageToken;
    } else {
      throw new Error(
        `backfill failed to get casts for fid ${fid} - ${response.error}]`
      );
    }
  } while (pageToken?.length);

  await prisma.farcasterCast.updateMany({
    where: {
      fid,
      hash: {
        notIn: hashes,
      },
    },
    data: {
      deleted: true,
    },
  });
};
