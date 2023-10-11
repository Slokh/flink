"use client";
/* eslint-disable @next/next/no-img-element */
import { CHANNELS_BY_URL } from "@/lib/channels";
import { CastsSort, Embed, FarcasterCast, FarcasterUser } from "@/lib/types";
import { formatText } from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { useIsVisible } from "@/hooks/useIsVisible";
import { Loading } from "../loading";
import Masonry from "react-masonry-css";
import "./masonry.css";

type Image = {
  channelId?: string;
  url: string;
  user: FarcasterUser;
  text: string;
  hash: string;
};

export const ImageCast = ({ image }: { image: Image }) => {
  return (
    <Link
      href={`/${
        image.channelId ? `channels/${image.channelId}` : image.user.fname
      }/${image.hash}`}
      className="relative group cursor-pointer"
    >
      <img
        src={image.url}
        alt={image.url}
        className="rounded-lg transition-all duration-500 ease-in-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-90 transition-all duration-500 ease-in-out cursor-pointer"></div>
      <div className="absolute inset-0 flex items-end justify-start p-2 w-full">
        <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col w-full">
          <div className="flex flex-row items-center space-x-1">
            <Avatar className="h-4 w-4">
              <AvatarImage src={image.user.pfp} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div>{image.user.fname}</div>
          </div>
          <div className="text-xs line-clamp-2 w-full">{image.text}</div>
        </div>
      </div>
    </Link>
  );
};

export const ImageCasts = ({
  sort,
  parentUrl,
  time,
  page,
  fid,
  viewerFid,
  query,
}: {
  page: number;
  time?: string;
  parentUrl?: string;
  fid?: number;
  sort: CastsSort;
  viewerFid?: number;
  query?: string;
}) => {
  const [casts, setCasts] = useState<FarcasterCast[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const [done, setDone] = useState(false);
  const container = useRef(null);
  const visible = useIsVisible(container);
  const [isProcessing, setIsProcessing] = useState(false);

  const handle = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    let currentPage = Math.floor(casts.length / 25) + page - 1;
    const finalImages: any[] = [];
    const finalCasts: any[] = [];
    let isDone = false;
    do {
      currentPage++;
      const data = await fetch(
        `/api/casts?sort=${sort}${parentUrl ? `&parentUrl=${parentUrl}` : ""}${
          time ? `&time=${time}` : ""
        }${fid ? `&fid=${fid}` : ""}${
          currentPage ? `&page=${currentPage}` : ""
        }&all=true
        ${viewerFid ? `&viewerFid=${viewerFid}` : ""}${
          query ? `&query=${query}` : ""
        }`
      );
      const newCasts = await data.json();
      if (newCasts.length !== 25) {
        isDone = true;
      }
      finalCasts.push(...newCasts);
      finalImages.push(
        ...newCasts.flatMap((cast: FarcasterCast) =>
          cast.embeds
            .filter(
              ({ contentType, url }: Embed) =>
                (contentType?.startsWith("image") ||
                  url.includes("imgur.com")) &&
                !images.find((img) => img.url === url)
            )
            .map((embed: Embed) => ({
              channelId: cast.parentUrl
                ? CHANNELS_BY_URL[cast.parentUrl]?.channelId ||
                  encodeURIComponent(cast.parentUrl)
                : undefined,
              url: embed.url,
              user: cast.user,
              text: formatText(cast.text, cast.mentions, cast.embeds, true),
              hash: cast.hash,
            }))
        )
      );
    } while (finalImages.length === 0 && !isDone);
    setImages((images) => [...images, ...finalImages]);
    setCasts((casts) => [...casts, ...finalCasts]);
    if (isDone) setDone(true);
    if (firstLoad) {
      setFirstLoad(false);
    }
    setIsProcessing(false);
  };

  useEffect(() => {
    if (visible && !done) {
      handle();
    }
  }, [visible, casts, images]);

  const breakpointColumnsObj = {
    default: 5,
    1280: 4,
    1024: 3,
    768: 2,
    640: 1,
  };

  return (
    <ScrollArea className="flex h-full p-1">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map((image, i) => (
          <div key={image.url} className="p-1">
            <ImageCast image={image} />
          </div>
        ))}
      </Masonry>
      {!done && (
        <div className="p-4" ref={container}>
          <Loading />
        </div>
      )}
    </ScrollArea>
  );
};
