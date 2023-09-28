import { ChannelUsers } from "@/components/stats/channel-users";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getChannelStats } from "@/lib/requests";
import { CastsQuery } from "@/lib/types";

export default async function Home({ params, searchParams }: CastsQuery) {
  const { users } = await getChannelStats(params.channel, searchParams.time);
  return (
    <ScrollArea>
      <ChannelUsers data={users} />
    </ScrollArea>
  );
}
