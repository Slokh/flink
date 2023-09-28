"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHANNELS } from "@/lib/channels";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";

export const ChannelSelect = ({
  channel,
  onChange,
  disableAll,
  suffix,
}: {
  channel?: string;
  onChange?: any;
  disableAll?: boolean;
  suffix?: string;
}) => {
  const router = useRouter();
  return (
    <div>
      <Select
        defaultValue={channel}
        onValueChange={(value) =>
          onChange
            ? onChange(value)
            : router.push(value ? `/channels/${value}${suffix}` : "/")
        }
      >
        <SelectTrigger className="border-0 text-sm md:text-md font-semibold shadow-none p-0 h-6">
          <SelectValue placeholder="Go to..." />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-96">
            {channel && !disableAll && (
              <SelectItem value="" className="cursor-pointer">
                <div className="text-md font-semibold">All channels</div>
              </SelectItem>
            )}
            {disableAll && (
              <SelectItem value="" className="cursor-pointer">
                <div className="text-md font-semibold">No channel</div>
              </SelectItem>
            )}
            {CHANNELS.map((item) => (
              <SelectItem
                key={item.channelId}
                value={item.channelId}
                className="cursor-pointer"
              >
                <div className="flex flex-row items-center space-x-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={item.image} className="object-cover" />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div className="text-sm md:text-md font-semibold">
                    {item.name}
                  </div>
                </div>
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
};
