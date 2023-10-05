"use client";

import { useUser } from "@/context/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "../ui/button";
import { useEffect } from "react";
import { FileUpload } from "../file-upload";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Loading from "@/app/loading";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AddSigner } from "../auth-button";

const checkBytesLength = (text: string, maxLength: number) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  return encoded.length <= maxLength;
};

const formSchema = z.object({
  fname: z
    .string()
    .refine((text) => checkBytesLength(text, 32), { message: "Invalid fname" }),
  display: z
    .string()
    .refine((text) => checkBytesLength(text, 32), { message: "Invalid fname" }),
  bio: z.string().refine((text) => checkBytesLength(text, 256), {
    message: "Invalid fname",
  }),
  pfp: z.string().refine((text) => checkBytesLength(text, 256), {
    message: "Invalid fname",
  }),
});

export const ProfileSettings = () => {
  const { user, primary, isLoading } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fname: "",
      display: "",
      bio: "",
      pfp: "",
    },
  });

  useEffect(() => {
    if (user || primary) {
      form.reset({
        fname: user?.fname || primary?.fname || "",
        display: user?.display || primary?.display || "",
        bio: user?.bio || primary?.bio || "",
        pfp: user?.pfp || primary?.pfp || "",
      });
    }
  }, [user, form, primary]);

  if (isLoading) return <Loading />;
  if (!primary && !user) {
    return <></>;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await fetch(`/api/auth/${user?.fid}/settings`, {
      method: "POST",
      body: JSON.stringify(values),
    });
  };

  return (
    <div className="flex flex-col px-2">
      {!user && (
        <Alert>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle className="font-semibold">No signer available</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            You need to add a signer to your account before you can change your
            profile settings.
            <div className="border rounded w-32 mt-2">
              <AddSigner />
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 p-4 max-w-lg"
        >
          <FormField
            disabled={!user}
            control={form.control}
            name="pfp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <FormControl>
                  <div className="flex flex-row space-x-8 items-center">
                    <FileUpload
                      onFileUpload={(url) => {
                        form.setValue("pfp", url);
                      }}
                    >
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={form.watch("pfp")}
                          className="object-cover"
                        />
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                    </FileUpload>
                    {user && (
                      <div className="flex flex-col space-y-4">
                        <FileUpload
                          onFileUpload={(url) => {
                            form.setValue("pfp", url);
                          }}
                        >
                          <div
                            className={`cursor-pointer ${buttonVariants({
                              size: "sm",
                            })}`}
                          >
                            Upload
                          </div>
                        </FileUpload>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => form.setValue("pfp", "")}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            disabled={!user}
            control={form.control}
            name="fname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="flink" {...field} />
                </FormControl>
                <FormDescription>
                  This is your unique Farcaster username. Must not exist
                  already.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={!user}
            control={form.control}
            name="display"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Flink" {...field} />
                </FormControl>
                <FormDescription>
                  This is your display name on Farcaster. It can be anything you
                  want.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={!user}
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Input placeholder="Shadowy Super Coder" {...field} />
                </FormControl>
                <FormDescription>
                  Tell Farcaster a little bit about yourself.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={!user} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};
