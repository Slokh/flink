import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHANNELS_BY_ID } from "@/lib/channels";
import { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: { channel: string };
}): Promise<Metadata> => {
  const channel = CHANNELS_BY_ID[params.channel] || {
    name: decodeURIComponent(params.channel),
    channelId: params.channel,
    image: {
      url: "/favicon.ico",
    },
    parentUrl: decodeURIComponent(params.channel),
  };

  return {
    title: `${channel.name}`,
    description: `View posts in the ${channel.name} channel.`,
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://flink.fyi/channels/${params.channel}`,
      title: `${channel.name}`,
      description: `View posts in the ${channel.name} channel.`,
      images: [channel.image],
      siteName: "flink",
    },
  };
};

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { channel: string };
}) {
  const channel = CHANNELS_BY_ID[params.channel] || {
    name: decodeURIComponent(params.channel),
    channelId: params.channel,
    image: {
      url: "/favicon.ico",
    },
    parentUrl: decodeURIComponent(params.channel),
  };
  const isUnknownChannel = !CHANNELS_BY_ID[params.channel];
  return (
    <div className="flex flex-col w-full">
      <ScrollArea>
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
        <div>{children}</div>
      </ScrollArea>
    </div>
  );
}
