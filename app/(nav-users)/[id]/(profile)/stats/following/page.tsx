import { FollowersChart } from "@/components/stats/followers-chart";
import { FollowersTable } from "@/components/stats/followers-table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getEntity, getUserFollowing } from "@/lib/requests";

export default async function Home({ params }: { params: { id: string } }) {
  const entity = await getEntity(params.id, false);
  if (!entity.fid) return <></>;

  const { following } = await getUserFollowing(entity.fid);

  const data = following.reduce((acc, f) => {
    const timestamp = new Date(f.timestamp).setHours(0, 0, 0, 0);
    if (!acc[timestamp]) {
      acc[timestamp] = {
        timestamp,
        followers: 0,
      };
    }
    acc[timestamp].followers += 1;
    return acc;
  }, {} as Record<number, any>);

  return (
    <ScrollArea>
      <ScrollBar orientation="horizontal" />
      <FollowersChart
        data={Object.values(data).sort((a, b) =>
          b.timestamp < a.timestamp ? 1 : -1
        )}
      />
      <FollowersTable followers={following} />
    </ScrollArea>
  );
}
