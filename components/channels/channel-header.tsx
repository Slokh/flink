import { CHANNELS_BY_ID } from "@/lib/channels";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const ChannelHeader = ({ channelId }: { channelId: string }) => {
  const channel = CHANNELS_BY_ID[channelId] || {
    name: decodeURIComponent(channelId),
    channelId: channelId,
    parentUrl: decodeURIComponent(channelId),
  };
  const isUnknownChannel = !CHANNELS_BY_ID[channelId];
  return (
    <div className="flex flex-row items-center p-4 space-x-2">
      <Avatar className="h-10 w-10">
        <AvatarImage src={channel.image} className="object-cover" />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <div className="font-semibold text-xl">
          {isUnknownChannel ? "Unknown" : channel.name}
        </div>
        <div className="text-zinc-500 text-xs hidden lg:flex">
          {channel.parentUrl}
        </div>
      </div>
    </div>
  );
};
