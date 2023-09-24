import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { Separator } from "@/components/ui/separator";
import { ChannelSidebar } from "@/components/channels/channel-sidebar";

export const metadata: Metadata = {
  title: "flink",
  description: "Automatically linked identities across platforms and protocols",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flink.fyi",
    title: "flink",
    description:
      "Automatically linked identities across platforms and protocols",
    images: [
      {
        url: "/flink.png",
        width: 1200,
        height: 630,
        alt: "flink",
      },
    ],
    siteName: "flink",
  },
};

export default function ChannelSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row justify-center w-full">
      {children}
      <div className="hidden lg:flex">
        <Separator orientation="vertical" />
        <ChannelSidebar />
      </div>
    </div>
  );
}
