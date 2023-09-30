import { Separator } from "@/components/ui/separator";
import { ChannelSidebar } from "@/components/channels/channel-sidebar";

export default function ChannelSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row w-full">
      {children}
      <div className="hidden xl:flex">
        <Separator orientation="vertical" />
        <ChannelSidebar />
      </div>
    </div>
  );
}
