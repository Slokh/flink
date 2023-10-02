import { ChannelChart } from "@/components/stats/channel-chart";
import { UserTable } from "@/components/stats/user-table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getEntity, getUserStats } from "@/lib/requests";
import { CastsQuery } from "@/lib/types";

export default async function Home({ params }: CastsQuery) {
  const entity = await getEntity(params.id, false);
  if (!entity.fid) return <></>;

  const { stats } = await getUserStats(entity.fid);

  return (
    <ScrollArea>
      <ScrollBar orientation="horizontal" />
      <ChannelChart data={stats} />
      <UserTable data={stats} />
    </ScrollArea>
  );
}
