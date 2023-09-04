import { getHubClient } from "../farcaster/hub";
import { watchFarcasterCasts } from "../farcaster/casts";

const run = async () => {
  const client = await getHubClient();
  await watchFarcasterCasts(client);
};

run();
