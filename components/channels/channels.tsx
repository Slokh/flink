import { ChannelsTable } from "./channels-table";
import { getChannels } from "@/lib/requests";

export const Channels = async ({ time }: { time: string }) => {
  const channels = await getChannels(time);

  return (
    <div className="w-full">
      <ChannelsTable channels={channels} time={time} />
    </div>
  );
};
