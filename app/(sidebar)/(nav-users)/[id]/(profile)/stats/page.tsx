import { ChannelChart } from "@/components/stats/channel-chart";
import { ChannelTable } from "@/components/stats/channel-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getEntity, getUserStats } from "@/lib/requests";
import { CastsQuery } from "@/lib/types";

export default async function Home({ params }: CastsQuery) {
  const entity = await getEntity(params.id, false);
  if (!entity.fid) return <></>;

  const { stats } = await getUserStats(entity.fid);

  return (
    <ScrollArea>
      <div className="h-[200px] lg:h-[300px] mb-4">
        <ChannelChart data={stats} />
      </div>
      <ChannelTable data={stats} />
    </ScrollArea>
  );
}
