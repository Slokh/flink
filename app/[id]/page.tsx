import {
  Profile,
  ProfileIdentity,
  ProfileOverview,
} from "@/components/panels/profile";
import { SearchInput } from "@/components/search-input";
import { Entity } from "@/lib/types";
import { Metadata } from "next";
import { headers } from "next/headers";
import { Casts } from "@/components/panels/casts";
import { Layout } from "@/components/layout";
import { RefreshButton } from "@/components/refresh-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const { display, bio } = entity;

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
        <div className="flex flex-col items-center w-full p-4 min-h-screen mt-4">
          <div className="flex flex-col items-center w-full space-y-4">
            <h1>Unknown identity</h1>
            <SearchInput />
          </div>
        </div>
      </>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col lg:hidden items-center">
        <ProfileOverview id={params.id} entity={entity} />
        <Tabs
          defaultValue="profile"
          className="w-full p-2 justify-center items-center flex flex-col"
        >
          <TabsList className="w-full max-w-xs flex">
            <TabsTrigger value="profile" className="w-full">
              Profile
            </TabsTrigger>
            <TabsTrigger value="casts" className="w-full">
              Casts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <div className="flex flex-col items-center">
              <ProfileIdentity entity={entity} />
              <div className="flex flex-col space-y-4 mt-4">
                <SearchInput />
                <RefreshButton id={params.id} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="casts">
            <div className="flex justify-center">
              <div className="w-full">
                {entity.fid && <Casts fid={entity.fid} />}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex flex-row justify-center h-full hidden lg:flex">
        <div className="min-w-80 w-80">
          <ScrollArea className="h-full">
            <div className="flex flex-col items-center space-y-4 w-full">
              <Profile id={params.id} entity={entity} />
            </div>
          </ScrollArea>
        </div>
        <Separator orientation="vertical" />
        <div className="w-[32rem]">
          <ScrollArea className="h-full">
            <div className="flex flex-col items-center space-y-4 w-full">
              {entity.fid && <Casts fid={entity.fid} />}
            </div>
          </ScrollArea>
        </div>
        <Separator orientation="vertical" />
        <div className="min-w-80 w-80">
          <ScrollArea className="h-full">
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="flex flex-col items-center w-full space-y-4 p-4">
                <SearchInput />
                <RefreshButton id={params.id} />
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}
