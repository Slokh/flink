import { Metadata } from "next";
import { headers } from "next/headers";

import { getCast, getEntity } from "@/lib/requests";
import { formatText } from "@/lib/casts";
import { getPreview } from "@/components/casts/cast";

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
        "Automatically linked identities across platforms and protocols",
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
  }

  const { display, fname } = entity;

  const title = `${display?.value || params.id} ${fname ? `(@${fname})` : ""}`;
  const description = formatText(cast.text, cast.mentions, cast.embeds, false);
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
      url: `https://flink.fyi/${params.id}`,
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
  return <>{children}</>;
}
