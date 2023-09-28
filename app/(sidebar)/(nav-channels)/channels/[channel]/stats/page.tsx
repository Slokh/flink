import { ChannelChart } from "@/components/stats/channel-chart";
import { ChannelTable } from "@/components/stats/channel-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getChannelStats } from "@/lib/requests";
import { CastsQuery } from "@/lib/types";

export default async function Home({ params }: CastsQuery) {
  const { data } = await getChannelStats(params.channel);
  return (
    <ScrollArea>
      <div className="h-[200px] lg:h-[300px] mb-4">
        <ChannelChart data={data} />
      </div>
      <ChannelTable data={data} />
    </ScrollArea>
  );
}
