import { ChannelChart } from "@/components/stats/channel-chart";
import { ChannelTable } from "@/components/stats/channel-table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getChannelStats } from "@/lib/requests";
import { CastsQuery } from "@/lib/types";

export default async function Home({ params }: CastsQuery) {
  const { stats } = await getChannelStats(params.channel);
  return (
    <ScrollArea>
      <ScrollBar orientation="horizontal" />
      <ChannelChart data={stats} />
      <ChannelTable data={stats} />
    </ScrollArea>
  );
}
