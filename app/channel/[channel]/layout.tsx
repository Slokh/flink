import { CHANNELS_BY_ID } from "@/lib/channels";
import { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: { channel: string };
}): Promise<Metadata> => {
  const channel = CHANNELS_BY_ID[params.channel];

  return {
    title: `${channel.name}`,
    description: `View posts in the ${channel.name} channel.`,
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://flink.fyi/channel/${params.channel}`,
      title: `${channel.name}`,
      description: `View posts in the ${channel.name} channel.`,
      images: [channel.image],
      siteName: "flink",
    },
  };
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
