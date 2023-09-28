import { ChannelsTable } from "@/components/stats/channels-table";
import { getChannelEngagementStats } from "@/lib/requests";

export default async function Home({
  searchParams,
}: {
  searchParams: { time?: string };
}) {
  const time = searchParams.time || "day";
  const channels = await getChannelEngagementStats(time);

  return (
    <div className="w-full">
      <ChannelsTable channels={channels} time={time} />
    </div>
  );
}
