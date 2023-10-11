import { UsersTable } from "@/components/stats/users-table";
import { getUserEngagementStats } from "@/lib/requests";

export default async function Home({
  params,
  searchParams,
}: {
  params: { query: string };
  searchParams: { time?: string };
}) {
  const time = searchParams.time || "all";
  const users = await getUserEngagementStats(time, params.query);

  return (
    <div className="w-full">
      <UsersTable users={users} time={time} />
    </div>
  );
}
