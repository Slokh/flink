import { watchFarcasterUsers } from "../farcaster/users";
import { getHubClient } from "../farcaster/hub";

const run = async () => {
  const client = await getHubClient();
  await watchFarcasterUsers(client);
};

run();
