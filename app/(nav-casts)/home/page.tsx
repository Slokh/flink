"use client";

import { MoreCasts } from "@/components/casts/more-casts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/context/user";
import { CastsQuery, CastsSort } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "../loading";
import { ImageCasts } from "@/components/casts/image-casts";

export default function Home({ searchParams }: CastsQuery) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const page = parseInt(searchParams.page || "1");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  if (isLoading) return <Loading />;

  if (searchParams.display === "images") {
    return (
      <ImageCasts sort={CastsSort.Home} page={page} viewerFid={user?.fid} />
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col w-full">
        <MoreCasts sort={CastsSort.Home} page={page} viewerFid={user?.fid} />
      </div>
    </ScrollArea>
  );
}
