import { Navbar } from "@/components/navbar";
import { Overview } from "@/components/overview";
import { Profile } from "@/components/profile";
import { SearchInput } from "@/components/search-input";
import { Entity } from "@/lib/types";
import { Metadata } from "next";
import { headers } from "next/headers";

const getEntity = async (id: string, create: boolean): Promise<Entity> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/users/${id}${create ? "?create=true" : ""}`
  );
  return await data.json();
};

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
        url: "https://flink.vercel.app",
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

  const { pfps, displays, bios } = entity;
  const pfp = pfps[0];
  const display = displays[0];
  const bio = bios[0];

  return {
    title: display?.value || params.id,
    description:
      bio?.value || `Check out ${display?.value || params.id}'s profile`,
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://flink.vercel.app/${params.id}`,
      title: display?.value || params.id,
      description:
        bio?.value || `Check out ${display?.value || params.id}'s profile`,
      images: [
        {
          url: `${protocol}://${host}/api/og/${params.id}`,
          width: 1200,
          height: 630,
          alt: "flink",
        },
      ],
      siteName: "flink",
    },
  };
};

export default async function User({ params }: { params: { id: string } }) {
  const entity = await getEntity(params.id, true);

  // @ts-ignore
  if (!entity || entity?.error) {
    return (
      <>
        <Navbar variant="top" />
        <div className="flex flex-col items-center w-full p-4 min-h-screen mt-4">
          <div className="flex flex-col items-center w-full max-w-sm space-y-4">
            <h1>Unknown identity</h1>
            <SearchInput />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center w-full p-4 min-h-screen mt-4">
        <div className="flex flex-col items-center w-full max-w-sm space-y-4">
          <Overview id={params.id} entity={entity} />
          <Profile id={params.id} entity={entity} />
        </div>
      </div>
      <Navbar variant="bottom" />
    </>
  );
}
