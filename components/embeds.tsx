/* eslint-disable @next/next/no-img-element */
import { Metadata } from "unfurl.js/dist/types";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Embed, NftMetadata } from "@/lib/types";
import { URL_REGEX } from "@/indexer/links";

const TwitterEmbed = ({
  metadata,
  url,
}: {
  metadata: Metadata;
  url: string;
}) => {
  const urlHost =
    (url.startsWith("http") ? url.split("/")[2] : url.split("/")[0]) || "";
  const image =
    metadata.twitter_card.images?.[0]?.url ||
    metadata.open_graph?.images?.[0]?.url;

  return (
    <a href={url || "#"} target="_blank" className="max-w-lg w-full">
      <Card className="rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
        {image && (
          <div>
            <img
              alt="embed_image"
              src={image}
              className="w-full rounded-t-lg h-56 object-cover"
            />
          </div>
        )}
        <div className="flex flex-col p-2 space-y-1">
          <div className="flex flex-row space-x-2 items-center">
            {metadata.favicon && (
              <img
                alt="embed_icon"
                src={metadata.favicon}
                className="h-4 w-4"
              />
            )}
            <div className="font-normal font-semibold text-sm">
              {metadata.open_graph?.title?.replace(
                /0x([a-fA-F0-9]{4}).*/,
                "0x$1..."
              )}
            </div>
          </div>
          <div className="text-zinc-500 text-xs">{urlHost}</div>
          <div className="text-zinc-500 text-sm line-clamp-4">
            {metadata.open_graph?.description
              ?.replaceAll(URL_REGEX, "")
              .replace(/0x([a-fA-F0-9]{4}).*/, "0x$1...")}
          </div>
        </div>
      </Card>
    </a>
  );
};

const UrlEmbed = ({ metadata, url }: { metadata: Metadata; url: string }) => {
  const urlHost =
    (url.startsWith("https://") ? url.split("/")[2] : url.split("/")[0]) || "";

  let title = metadata.open_graph?.title || metadata.title || "";
  let username;
  if (["twitter.com", "x.com"].includes(urlHost)) {
    title = title.replace(" on X", "").replace(" on Twitter", "");
    if (url.startsWith("https://")) {
      username = url.split("/")[3];
    } else {
      username = url.split("/")[1];
    }
  }

  return (
    <a href={url || "#"} target="_blank" className="max-w-lg w-full">
      <Card className="rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
        <div className="flex flex-col p-2 space-y-1">
          <div className="flex flex-row space-x-2 items-center">
            {metadata.favicon && (
              <img
                alt="embed_icon"
                src={metadata.favicon}
                className="h-4 w-4"
              />
            )}
            <div className="flex flex-row space-x-1 items-center">
              <div className="font-semibold text-sm">
                {title?.replace(/0x([a-fA-F0-9]{4}).*/, "0x$1...")}
              </div>
              {username && (
                <div className="font-normal text-sm text-zinc-500">{`@${username}`}</div>
              )}
            </div>
          </div>
          {!metadata.open_graph?.images && (
            <div className="text-zinc-500 text-xs">{urlHost}</div>
          )}
          <div className="text-sm">
            {metadata.open_graph?.description?.replace(
              /0x([a-fA-F0-9]{4}).*/,
              "0x$1..."
            )}
          </div>
        </div>
        <div>
          {metadata.open_graph?.images
            ?.filter(({ url }) => url !== "https://warpcast.com/og-logo.png")
            .map(({ url }) => (
              <img
                alt="embed_image"
                key={url}
                src={url}
                className="w-full rounded-b-lg object-cover"
              />
            ))}
        </div>
      </Card>
    </a>
  );
};

const ImageEmbed = ({ url }: { url: string }) => {
  return (
    <div className="md:max-w-xl">
      <Dialog>
        <DialogTrigger>
          <img src={url} alt={url} className="rounded-lg" />
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="h-4"></DialogTitle>
            <DialogDescription>
              <img src={url} alt={url} className="rounded-lg" />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const NftEmbed = ({ metadata }: { metadata: NftMetadata }) => (
  <a href={metadata.externalUrl || "#"} target="_blank">
    <Card className="rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
      <div>
        <img
          alt="embed_image"
          src={metadata.image_url}
          className="w-full rounded-t-lg h-56 object-cover"
        />
      </div>
      <div className="flex flex-col p-2 space-y-1">
        <div className="flex flex-row space-x-2 items-center">
          <div className="font-normal font-semibold">{metadata.name}</div>
        </div>
        {/* <div className="text-zinc-500">{metadata.description}</div> */}
      </div>
    </Card>
  </a>
);

export const EmbedPreview = ({ embed }: { embed: Embed }) => {
  if (embed.url.includes("i.imgur.com")) {
    return <ImageEmbed url={embed.url} />;
  }

  if (
    !embed.contentMetadata ||
    Object.keys(embed.contentMetadata).length === 0
  ) {
    if (embed.contentType?.startsWith("image")) {
      return <ImageEmbed url={embed.url} />;
    }
    return <></>;
  }

  if (embed.url.startsWith("chain://")) {
    return <NftEmbed metadata={embed.contentMetadata as NftMetadata} />;
  }

  const metadata = embed.contentMetadata as Metadata;

  if (metadata.twitter_card) {
    return <TwitterEmbed metadata={metadata} url={embed.url} />;
  }

  return <UrlEmbed metadata={metadata} url={embed.url} />;
};
