import { UserChannels } from "@/components/stats/user-channels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getEntity, getUserStats } from "@/lib/requests";
import { CastsQuery } from "@/lib/types";

export default async function Home({ params, searchParams }: CastsQuery) {
  const entity = await getEntity(params.id, false);
  if (!entity.fid) return <></>;

  const { users } = await getUserStats(entity.fid, searchParams.time);

  return (
    <ScrollArea>
      <UserChannels data={users} />
    </ScrollArea>
  );
}
