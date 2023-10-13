import { Metadata } from "next";
import { headers } from "next/headers";

import { getCast, getEntity } from "@/lib/requests";
import { formatText } from "@/lib/utils";
import { getPreview } from "@/components/casts/cast";
import { SearchInput } from "@/components/search-input";

export const generateMetadata = async ({
  params,
}: {
  params: { id: string; cast: string };
}): Promise<Metadata> => {
  const [entity, cast] = await Promise.all([
    getEntity(params.id, false),
    getCast(params.cast),
  ]);
  // @ts-ignore
  if (!entity || entity?.error || !cast || cast?.error) {
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

  const { display, fname } = entity;

  const title = `${display?.value || params.id} ${fname ? `(@${fname})` : ""}`;

  let offset = 0;
  let updatedMentionsPositions = []; // Array to store updated positions

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
      url: `https://flink.fyi/${params.id}`,
      title,
      description,
      images: [`/api/og/${params.cast}`],
      siteName: "flink",
    },
  };
};

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string; cast: string };
}) {
  const entity = await getEntity(params.id, true);

  // @ts-ignore
  if (!entity || entity?.error) {
    return (
      <div className="flex flex-col items-center w-full p-4 min-h-screen mt-4">
        <div className="flex flex-col items-center w-full space-y-4">
          <h1>Unknown identity</h1>
          <SearchInput />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full flex-grow">{children}</div>
  );
}
