import { UsersTable } from "@/components/stats/users-table";
import { getUserEngagementStats } from "@/lib/requests";

export default async function Home({
  searchParams,
}: {
  searchParams: { time?: string };
}) {
  const time = searchParams.time || "day";
  const users = await getUserEngagementStats(time);

  return (
    <div className="w-full">
      <UsersTable users={users} time={time} />
    </div>
  );
}
