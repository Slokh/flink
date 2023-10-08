import { MembersTable } from "@/components/stats/members-table";
import { CHANNELS_BY_ID } from "@/lib/channels";
import { getChannelMembers } from "@/lib/requests";

export default async function Home({
  params,
}: {
  params: { channel: string };
}) {
  const { members } = await getChannelMembers(
    CHANNELS_BY_ID[params.channel]?.parentUrl
      ? encodeURIComponent(CHANNELS_BY_ID[params.channel]?.parentUrl)
      : params.channel
  );
  return <MembersTable members={members} />;
}
