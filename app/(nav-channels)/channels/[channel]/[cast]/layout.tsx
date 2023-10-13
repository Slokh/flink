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

  let offset = 0;
  let updatedMentionsPositions = []; // Array to store updated positions

  const title = `${cast.user?.display || cast.user?.fname || cast.user?.fid} ${
    cast.user?.fname ? `(@${cast.user?.fname})` : ""
  }`;

  let textBuffer = Buffer.from(cast.text, "utf-8");

  const sortedMentions = cast.mentions.sort((a, b) => b.position - a.position);

  for (let i = 0; i < sortedMentions.length; i++) {
    if (!sortedMentions[i].mention) continue;
    const adjustedMentionPosition = sortedMentions[i].position;
    const mentionUsername = sortedMentions[i].mention.fname;
    const mentionLinkBuffer = Buffer.from(`@${mentionUsername}`, "utf-8");
    const actualPosition = adjustedMentionPosition;
    const beforeMention = textBuffer.slice(0, actualPosition);
    const afterMention = textBuffer.slice(actualPosition);
    textBuffer = Buffer.concat([
      beforeMention,
      mentionLinkBuffer,
      afterMention,
    ]);
    offset += mentionLinkBuffer.length;
    updatedMentionsPositions.push(actualPosition);
  }

  const description = textBuffer.toString("utf-8");

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
      images: [`/api/og/${params.cast}`],
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
