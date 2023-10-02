import { Metadata } from "next";

import { getCast } from "@/lib/requests";
import { formatText } from "@/lib/utils";
import { getPreview } from "@/components/casts/cast";

export const generateMetadata = async ({
  params,
}: {
  params: { cast: string; channel: string };
}): Promise<Metadata> => {
  const cast = await getCast(params.cast);

  // @ts-ignore
  if (!cast || cast?.error) {
    return {
      title: "flink",
      description:
        "A Reddit-like interface for Farcaster to see hot & trending conversations",
      icons: {
        icon: "/favicon.ico",
      },
      openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://flink.fyi",
        title: "flink",
        description:
          "A Reddit-like interface for Farcaster to see hot & trending conversations",
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
  }

  const { display, fname, fid } = cast.user;

  const title = `${display || fname || fid} ${fname ? `(@${fname})` : ""}`;
  const description = formatText(cast.text, cast.mentions, cast.embeds, true);
  const { previewImage } = getPreview(cast.embeds);

  return {
    title,
    description,
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://flink.fyi/channels/${params.channel}/${params.cast}`,
      title,
      description,
      images: [previewImage || "/flink.png"],
      siteName: "flink",
    },
  };
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div style={{ height: "calc(100vh - 171px)" }}>{children}</div>;
}
