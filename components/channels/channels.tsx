import { ChannelsTable } from "../stats/channels-table";
import { getChannelEngagementStats } from "@/lib/requests";

export const Channels = async ({ time }: { time: string }) => {
  const channels = await getChannelEngagementStats(time);

  return (
    <div className="w-full">
      <ChannelsTable channels={channels} time={time} />
    </div>
  );
};
