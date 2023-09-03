import { backfillFarcasterUsers } from "../farcaster/users";
import { getHubClient } from "../farcaster/hub";

const run = async () => {
  const client = await getHubClient();
  await backfillFarcasterUsers(client);
};

run();
