/* eslint-disable @next/next/no-img-element */
import { Metadata } from "unfurl.js/dist/types";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CastMetadata, Embed, FarcasterUser, NftMetadata } from "@/lib/types";
import Link from "next/link";
import { formatText } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceStrict } from "date-fns";
import { VideoPlayer } from "./video-player";
import { MintEmbed } from "./mints/mint-embed";

const URL_REGEX =
  /\b(?:https?:\/\/|www\.|ftp:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?\b/gi;

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
    metadata.open_graph?.images?.[0]?.url ||
    metadata.twitter_card.images?.[0]?.url;

  return (
    <a href={url || "#"} target="_blank" className="max-w-lg w-full">
      <Card className="rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-none">
        {image && (
          <div>
            <img
              src={image}
              className="w-full rounded-t-lg h-[295px] object-cover bg-border"
            />
          </div>
        )}
        <div className="flex flex-col p-2 space-y-1">
          <div className="flex flex-row space-x-2 items-center">
            {metadata.favicon && !metadata.favicon.includes("discord.com") && (
              <Avatar className="w-4 h-4">
                <AvatarImage src={metadata.favicon} />
                <AvatarFallback></AvatarFallback>
              </Avatar>
            )}
            <div className="font-semibold text-sm line-clamp-1">
              {metadata.open_graph?.title?.replace(
                /0x([a-fA-F0-9]{4}).*/,
                "0x$1..."
              ) || urlHost}
            </div>
          </div>
          <div className="text-muted-foreground text-xs">{urlHost}</div>
          <div className="text-muted-foreground text-sm line-clamp-4">
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
    (url.startsWith("http") ? url.split("/")[2] : url.split("/")[0]) || "";

  let title = metadata.open_graph?.title || metadata.title || "";
  let username;
  if (["twitter.com", "x.com"].includes(urlHost)) {
    title = title.replace(" on X", "").replace(" on Twitter", "");
    if (url.startsWith("https://")) {
      username = url.split("/")[3].split("?")[0];
    } else {
      username = url.split("/")[1].split("?")[0];
    }
  }
  const image = metadata.open_graph?.images?.[0]?.url;

  return (
    <a href={url || "#"} target="_blank" className="max-w-lg w-full">
      <Card className="rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-none">
        <div className="flex flex-col p-2 space-y-1">
          <div className="flex flex-row space-x-2 items-center">
            {metadata.favicon && (
              <Avatar className="w-4 h-4">
                <AvatarImage src={metadata.favicon} />
                <AvatarFallback></AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-row space-x-1 items-center line-clamp-1">
              <div className="font-semibold text-sm">
                {title?.replace(/0x([a-fA-F0-9]{4}).*/, "0x$1...") || urlHost}
              </div>
              {username && (
                <div className="font-normal text-sm text-muted-foreground">{`@${username}`}</div>
              )}
            </div>
          </div>
          {!metadata.open_graph?.images && (
            <div className="text-muted-foreground text-xs">{urlHost}</div>
          )}
          <div className="text-sm">
            {metadata.open_graph?.description?.replace(
              /0x([a-fA-F0-9]{4}).*/,
              "0x$1..."
            )}
          </div>
        </div>
        <div>
          {image && image !== "https://warpcast.com/og-logo.png" && (
            <div>
              <img
                alt="embed_image"
                src={image}
                className="w-full rounded-lg h-[295px] object-cover"
              />
            </div>
          )}
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
        <DialogContent className="max-w-4xl p-0 md:w-fit">
          <img
            src={url}
            alt={url}
            className="rounded-lg object-contain max-h-full"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const NftEmbed = ({ metadata }: { metadata: NftMetadata }) => (
  <a href={metadata.externalUrl || "#"} target="_blank">
    <Card className="rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-none">
      <div>
        <img
          alt="embed_image"
          src={metadata.image_url}
          className="w-full rounded-t-lg h-56 object-cover"
        />
      </div>
      <div className="flex flex-col p-2 space-y-1">
        <div className="flex flex-row space-x-2 items-center">
          <div className="font-semibold">{metadata.name}</div>
        </div>
        {/* <div className="text-muted-foreground">{metadata.description}</div> */}
      </div>
    </Card>
  </a>
);

export const FlinkEmbed = ({ metadata }: { metadata: CastMetadata }) => {
  // @ts-ignore
  const embeds: Embed[] = metadata.cast.urlEmbeds
    .filter(({ contentType }: any) => contentType?.startsWith("image/"))
    .map(({ url, contentType, contentMetadata }: any) => ({
      url,
      contentType,
      contentMetadata,
    }));

  const formattedText = formatText(
    metadata.cast.text,
    metadata.cast.mentions,
    true
  );
  return (
    <Link
      href={`https://flink.fyi/${metadata.user?.fname}/${metadata.cast.hash}`}
      className="max-w-lg w-full"
    >
      <Card className="rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-none">
        <div className="flex flex-col p-2 space-y-1">
          <div className="flex flex-row space-x-1 items-center text-sm">
            <Avatar className="h-4 w-4">
              <AvatarImage src={metadata.user?.pfp} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="font-semibold">
              {metadata.user?.display || metadata.user?.fname}
            </div>
            <div className="text-purple-600 dark:text-purple-400">{`@${metadata.user?.fname}`}</div>
            <div
              className="text-muted-foreground"
              title={new Date(metadata.cast.timestamp).toLocaleString()}
            >
              {formatDistanceStrict(
                new Date(metadata.cast.timestamp),
                new Date(),
                {
                  addSuffix: true,
                }
              )}
            </div>
          </div>
          <div className="text-muted-foreground text-sm line-clamp-4 flex flex-col whitespace-pre-wrap break-words leading-6 tracking-normal w-full space-y-2">
            <div dangerouslySetInnerHTML={{ __html: formattedText }} />
            {embeds.length > 0 && (
              <div className="flex flex-row flex-wrap">
                {embeds.map((embed, i) => (
                  <div key={i} className="w-1/2 pr-2">
                    <EmbedPreview embed={embed} user={metadata.user} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export const EmbedPreview = ({
  embed,
  text,
  user,
}: {
  embed: Embed;
  text?: string;
  user?: FarcasterUser;
}) => {
  if (user && embed.transactionMetadata) {
    return <MintEmbed embed={embed} user={user} />;
  }

  return <EmbedPreviewContent embed={embed} text={text} />;
};

export const EmbedPreviewContent = ({
  embed,
  text,
}: {
  embed: Embed;
  text?: string;
}) => {
  if (embed.contentType?.startsWith("image")) {
    return <ImageEmbed url={embed.url} />;
  }

  if (
    embed.contentType?.startsWith("video") ||
    embed.url.includes("youtube") ||
    embed.url.includes("youtu.be") ||
    embed.url.endsWith(".mp4")
  ) {
    return <VideoPlayer url={embed.url} />;
  }

  if (
    !embed.contentMetadata ||
    Object.keys(embed.contentMetadata).length === 0
  ) {
    if (embed.contentType?.startsWith("image")) {
      return <ImageEmbed url={embed.url} />;
    }
    if (text?.includes(embed.url)) {
      return <></>;
    }

    return (
      <a
        href={embed.url}
        className="text-purple-600 dark:text-purple-400 hover:underline"
        target="_blank"
      >
        {embed.url}
      </a>
    );
  }

  if (embed.url.startsWith("chain://")) {
    return <NftEmbed metadata={embed.contentMetadata as NftMetadata} />;
  }

  if (
    (embed.url.includes("warpcast.com") || embed.url.includes("flink.fyi")) &&
    embed.url.match(/0x[0-9a-fA-F]+$/i)
  ) {
    return <FlinkEmbed metadata={embed.contentMetadata as CastMetadata} />;
  }

  const metadata = embed.contentMetadata as Metadata;

  if (metadata.twitter_card) {
    return <TwitterEmbed metadata={metadata} url={embed.url} />;
  }

  return <UrlEmbed metadata={metadata} url={embed.url} />;
};
