import { Metadata } from "next";
import { headers } from "next/headers";

import { Profile } from "@/components/ui/profile";
import { SearchInput } from "@/components/search-input";
import { Separator } from "@/components/ui/separator";
import { getEntity } from "@/lib/requests";

export const generateMetadata = async ({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> => {
  const entity = await getEntity(params.id, false);
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";

  // @ts-ignore
  if (!entity || entity?.error) {
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

  const { display, bio, pfp, fname } = entity;

  return {
    title: `${display?.value || params.id} ${fname ? `(@${fname})` : ""}`,
    description:
      bio?.value || `Check out ${display?.value || params.id}'s profile`,
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://flink.fyi/${params.id}`,
      title: `${display?.value || params.id} ${fname ? `(@${fname})` : ""}`,
      description:
        bio?.value || `Check out ${display?.value || params.id}'s profile`,
      images: [pfp?.value || "/flink.png"],
      siteName: "flink",
    },
  };
};

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
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
    <div className="flex flex-col lg:flex-row lg:justify-center w-full">
      <div className="flex flex-col flex-grow w-full">{children}</div>
      <div className="hidden lg:flex h-full">
        <Separator orientation="vertical" />
      </div>
      <div className="flex lg:hidden">
        <Separator orientation="horizontal" />
      </div>
      <div className="hidden lg:flex">
        <Profile id={params.id} entity={entity} />
      </div>
    </div>
  );
}
