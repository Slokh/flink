import { getChannelEngagementStats } from "@/lib/requests";
import { ChannelSidebarDisplay } from "./channel-sidebar-display";

export const ChannelSidebar = async () => {
	// const channels = await getChannelEngagementStats("sixHour");
	return <ChannelSidebarDisplay />;
};
