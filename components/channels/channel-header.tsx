import { CHANNELS_BY_ID } from "@/lib/channels";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { FollowChannel } from "../actions/follow-channel";

export const ChannelHeader = ({ channelId }: { channelId: string }) => {
  const channel = CHANNELS_BY_ID[channelId] || {
    name: decodeURIComponent(channelId),
    channelId: channelId,
    parentUrl: decodeURIComponent(channelId),
  };
  const isUnknownChannel = !CHANNELS_BY_ID[channelId];
  return (
    <div className="flex flex-row items-center justify-between p-4">
      <div className="flex flex-row items-center space-x-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={channel.image} className="object-cover" />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-semibold text-xl">
            {isUnknownChannel ? "Unknown" : channel.name}
          </div>
          <div className="text-muted-foreground text-xs hidden lg:flex">
            {channel.parentUrl}
          </div>
        </div>
      </div>
      <FollowChannel />
    </div>
  );
};
