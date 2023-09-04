import { getHubClient } from "../farcaster/hub";
import { backfillFarcasterCasts } from "../farcaster/casts";

const run = async () => {
  const client = await getHubClient();
  await backfillFarcasterCasts(client);
};

run();
