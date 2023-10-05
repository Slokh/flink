/* eslint-disable @next/next/no-img-element */
"use client";
import { CameraIcon, Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { Loading } from "../loading";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { usePathname } from "next/navigation";
import { CHANNELS_BY_ID } from "@/lib/channels";
import { Channel, Embed, FarcasterCast } from "@/lib/types";
import { ChannelSelect } from "../channels/channel-select";
import { CastContent } from "../casts/cast-thread";
import { ScrollArea } from "../ui/scroll-area";
import { EmbedPreview } from "../embeds";
import { useUser } from "@/context/user";
import { FileUpload } from "../file-upload";

const formSchema = z.object({
  text: z.string().refine(
    (text) => {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(text);
      return encoded.length <= 320;
    },
    {
      message: "Cast is too long.",
    }
  ),
  embeds: z.array(z.string().url()).max(2),
});

const NewCastContent = ({ parent }: { parent?: string }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      embeds: [],
    },
  });

  const [embeds, setEmbeds] = useState<Embed[]>([]);
  const [files, setFiles] = useState<Embed[]>([]);
  const [fetchedEmbeds, setFetchedEmbeds] = useState<Record<string, Embed>>({});

  const pathname = usePathname();
  const [channel, setChannel] = useState<Channel | undefined>(undefined);

  useEffect(() => {
    if (!parent && pathname.includes("/channels/")) {
      setChannel(CHANNELS_BY_ID[pathname.split("/")[2]]);
    }
    setLoading(false);
  }, [parent, pathname]);

  const {
    watch,
    formState: { errors },
  } = form;
  const textValue = watch("text");

  useEffect(() => {
    form.trigger("text");

    const fetchEmbed = async (url: string) => {
      if (fetchedEmbeds[url]) return fetchedEmbeds[url];
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const metadata = await res.json();
      return metadata;
    };

    const fetchEmbeds = async (urls: string[]) => {
      const newFetchedEmbeds = (await Promise.all(urls.map(fetchEmbed)))
        .filter(
          ({ contentMetadata }) => Object.keys(contentMetadata).length > 0
        )
        .slice(0, 2 - files.length);
      const newFetchedEmbedsMap = newFetchedEmbeds.reduce(
        (acc, embed) => ({ ...acc, [embed.url]: embed }),
        {}
      );
      setFetchedEmbeds({ ...fetchedEmbeds, ...newFetchedEmbedsMap });
      setEmbeds(newFetchedEmbeds);
    };

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = textValue.match(urlRegex);
    if (urls && files.length < 2) {
      fetchEmbeds(urls);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textValue]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true);
    const urls = [
      ...files.map((file) => ({
        url: file.url,
      })),
      ...embeds.map((embed) => ({
        url: embed.url,
      })),
    ];
    const res = await fetch(`/api/auth/${user?.fid}/casts`, {
      method: "POST",
      body: JSON.stringify({
        text: values.text,
        embeds: urls,
        parent: parent || channel?.parentUrl,
      }),
    });
    const { hash } = await res.json();
    while (true) {
      const res2 = await fetch(`/api/casts/${hash}`);
      if (res2.ok) {
        // @ts-ignore
        window.location = `/${user?.fname}/${hash}`;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  className="resize-none"
                  placeholder="Type your message here..."
                  {...field}
                  onChange={(e) => {
                    field.onChange(e); // preserve the original onChange event from react-hook-form
                    e.target.style.height = "inherit";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              </FormControl>
              {errors.text && <FormMessage>{errors.text.message}</FormMessage>}
            </FormItem>
          )}
        />
        <ScrollArea>
          <div className="flex flex-col">
            <div className="flex flex-row">
              {files.map((file, i) => (
                <div key={file.url} className="m-2 relative">
                  <img src={file.url} alt="embed" />
                  <div
                    className=" absolute top-0 right-0 cursor-pointer bg-background rounded-full p-1 m-1"
                    onClick={() => {
                      const newFiles = [...files];
                      newFiles.splice(i, 1);
                      setFiles(newFiles);
                    }}
                  >
                    <Cross1Icon className="h-2 w-2" />
                  </div>
                </div>
              ))}
            </div>
            {embeds.map((embed, i) => (
              <div key={embed.url} className="m-2 relative">
                <EmbedPreview embed={embed} />
                <div
                  className=" absolute top-0 right-0 cursor-pointer bg-background rounded-full p-1 m-1"
                  onClick={() => {
                    const newEmbeds = [...embeds];
                    newEmbeds.splice(i, 1);
                    setEmbeds(newEmbeds);
                  }}
                >
                  <Cross1Icon className="h-2 w-2" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex flex-row justify-between items-center mt-2 space-x-2">
          <FileUpload
            isDisabled={files.length + embeds.length >= 2}
            onFileUpload={(url) =>
              setFiles([
                ...files,
                {
                  url,
                  urlHost: "imgur.com",
                  contentType: "image/png",
                  parsed: false,
                },
              ])
            }
          >
            {files.length + embeds.length >= 2 ? (
              <div className="p-2 cursor-pointer border rounded-lg text-zinc-500">
                <CameraIcon className="h-4 w-4" />
              </div>
            ) : (
              <div className="p-2 cursor-pointer border rounded-lg">
                <CameraIcon className="h-4 w-4" />
              </div>
            )}
          </FileUpload>
          <div className="flex flex-row space-x-2 items-center">
            {!loading && !parent && (
              <ChannelSelect
                channel={channel?.channelId}
                onChange={(value: string) => setChannel(CHANNELS_BY_ID[value])}
                disableAll
              />
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loading /> : "Cast"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

const NewCastDialog = ({
  parent,
  header,
  children,
}: {
  parent?: FarcasterCast;
  header?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { user } = useUser();
  if (!user) return <></>;

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
        {header}
        <NewCastContent parent={parent?.hash} />
      </DialogContent>
    </Dialog>
  );
};

export const NewCastButton = () => (
  <NewCastDialog
    header={
      <DialogHeader>
        <DialogTitle>New cast</DialogTitle>
        <DialogDescription></DialogDescription>
      </DialogHeader>
    }
  >
    <div className="flex flex-row space-x-2 items-center font-medium rounded-md bg-foreground text-background p-2 text-sm text-center h-8">
      <PlusIcon />
      New
    </div>
  </NewCastDialog>
);

export const ReplyCastButton = ({ parent }: { parent: FarcasterCast }) => (
  <NewCastDialog
    header={
      <ScrollArea className="max-h-96">
        <CastContent cast={parent} />
      </ScrollArea>
    }
    parent={parent}
  >
    <div className="hover:underline">reply</div>
  </NewCastDialog>
);
