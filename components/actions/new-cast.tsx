/* eslint-disable @next/next/no-img-element */
"use client";
import { UserAuthState, useUser } from "@/context/user";
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
import { Channel, FarcasterCast } from "@/lib/types";
import { ChannelSelect } from "../channel-select";
import { CastContent } from "../casts/cast-thread";
import { ScrollArea } from "../ui/scroll-area";

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

export const NewCast = ({
  parent,
  header,
  children,
}: {
  parent?: FarcasterCast;
  header?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { authState } = useUser();

  const [loadingChannel, setLoadingChannel] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signerState, user } = useUser();
  const [embeds, setEmbeds] = useState<string[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      embeds: [],
    },
  });

  const pathname = usePathname();
  const [channel, setChannel] = useState<Channel | undefined>(undefined);

  useEffect(() => {
    if (!parent && pathname.includes("/channel/")) {
      setChannel(CHANNELS_BY_ID[pathname.split("/")[2]]);
    }
    setLoadingChannel(false);
  }, [parent, pathname]);

  const {
    watch,
    formState: { errors },
  } = form;
  const textValue = watch("text");

  useEffect(() => {
    form.trigger("text");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textValue]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const res = await fetch("/api/casts", {
      method: "POST",
      body: JSON.stringify({
        signer_uuid: signerState?.signerUuid,
        text: values.text,
        embeds: embeds.map((url) => ({ url })),
        parent: parent?.hash || channel?.parentUrl,
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && embeds.length < 2) {
      const file = e.target.files[0];
      // Read the file as a data URL (base64)
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data: string = reader.result as string;

        // Remove the prefix that says what kind of data it is
        const base64string = base64data.split(",")[1];

        const res = await fetch("https://imgur-apiv3.p.rapidapi.com/3/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Client-ID 2c72c9f7fc84329",
            "X-RapidApi-Key":
              "0bb3ce13d0msh95902c15e7eb132p153594jsn33b6ad91d004",
          },
          body: JSON.stringify({ image: base64string }),
        });

        const { data } = await res.json();
        setEmbeds([...embeds, data.link]);
      };
    }
  };

  if (authState !== UserAuthState.LOGGED_IN) return <></>;

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
        {header}
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
                  {errors.text && (
                    <FormMessage>{errors.text.message}</FormMessage>
                  )}
                </FormItem>
              )}
            />
            <div className="flex flex-row">
              {embeds.map((embed, i) => (
                <div key={embed} className="m-2 relative">
                  <img src={embed} alt="embed" />
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
            <div className="flex flex-row justify-between items-center mt-2 space-x-2">
              <label htmlFor="embed">
                <div className="p-2 cursor-pointer border rounded-lg">
                  <CameraIcon className="h-4 w-4" />
                </div>
              </label>
              <Input
                id="embed"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex flex-row space-x-2 items-center">
                {!loadingChannel && !parent && (
                  <ChannelSelect
                    channel={channel?.channelId}
                    onChange={(value: string) =>
                      setChannel(CHANNELS_BY_ID[value])
                    }
                    disableAll
                  />
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? <Loading /> : "Cast"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const NewCastButton = () => (
  <NewCast
    header={
      <DialogHeader>
        <DialogTitle>New cast</DialogTitle>
        <DialogDescription></DialogDescription>
      </DialogHeader>
    }
  >
    <div className="flex flex-row space-x-2 items-center font-semibold rounded-xl bg-foreground text-background p-2 text-center">
      <PlusIcon />
      New cast
    </div>
  </NewCast>
);

export const ReplyCastButton = ({ parent }: { parent: FarcasterCast }) => (
  <NewCast
    header={
      <ScrollArea className="max-h-96">
        <CastContent cast={parent} />
      </ScrollArea>
    }
    parent={parent}
  >
    <div className="hover:underline">reply</div>
  </NewCast>
);
