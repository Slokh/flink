import { ChannelHeader } from "@/components/channels/channel-header";
import { ChannelNavigation } from "@/components/navigation/channel-navigation";

export default function NavCastsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { channel: string };
}) {
  return (
    <div className="flex flex-col w-full h-full flex-grow">
      <ChannelHeader channelId={params.channel} />
      <ChannelNavigation />
      {children}
    </div>
  );
}
