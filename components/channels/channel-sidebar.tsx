import { getChannels } from "@/lib/requests";
import { ChannelSidebarDisplay } from "./channel-sidebar-display";

export const ChannelSidebar = async () => {
  const channels = await getChannels("sixHour");
  return <ChannelSidebarDisplay channels={channels} />;
};
