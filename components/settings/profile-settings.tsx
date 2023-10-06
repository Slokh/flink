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
import { useEffect, useState } from "react";
import { FileUpload } from "../file-upload";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Loading from "@/app/loading";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AddAccount, AddSigner } from "../auth-button";
import { AlertDialog } from "@radix-ui/react-alert-dialog";
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Loading as LoadingIcon } from "@/components/loading";
import { useAccount, useSignTypedData, useSwitchNetwork } from "wagmi";

const checkBytesLength = (text: string, maxLength: number) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  return encoded.length <= maxLength;
};

const formSchema = z.object({
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
      display: "",
      bio: "",
      pfp: "",
    },
  });

  useEffect(() => {
    if (user || primary) {
      form.reset({
        display: user?.display || primary?.display || "",
        bio: user?.bio || primary?.bio || "",
        pfp: user?.pfp || primary?.pfp || "",
      });
    }
  }, [user, form, primary]);

  if (isLoading) return <Loading />;
  if (!primary && !user && !isLoading) {
    return (
      <div className="flex flex-col px-2">
        <Alert>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle className="font-semibold">No account</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            You don&apos;t currently have any accounts linked to this wallet.
            <div className="border rounded w-32 mt-2">
              <AddAccount />
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await fetch(`/api/auth/${user?.fid}/settings`, {
      method: "POST",
      body: JSON.stringify(values),
    });
  };

  return (
    <div className="flex flex-col px-2">
      <Alert>
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle className="font-semibold">Not supported</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          Modifying profile settings are currently not supported.
        </AlertDescription>
      </Alert>
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
            disabled={true || !user}
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
                    {!true && user && (
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
            disabled={true || !user}
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
            disabled={true || !user}
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
          <Button disabled={true || !user} type="submit">
            Submit
          </Button>
        </form>
      </Form>
      <ChangeUsername fid={user?.fid || 0} fname={user?.fname || ""} />
    </div>
  );
};

const VERIFYING_CONTRACT = "0xe3be01d99baa8db9905b33a3ca391238234b79d1";

// Define the EIP-712 domain
const domain = {
  name: "Farcaster name verification",
  version: "1",
  chainId: 1,
  verifyingContract: VERIFYING_CONTRACT,
} as const;

// Create the EIP-712 typed data
const types = {
  UserNameProof: [
    { name: "name", type: "string" },
    { name: "timestamp", type: "uint256" },
    { name: "owner", type: "address" },
  ],
};

const ChangeUsername = ({ fid, fname }: { fid: number; fname: string }) => {
  const [open, setOpen] = useState(false);
  const { address } = useAccount();
  const [input, setInput] = useState(fname);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { primary } = useUser();
  const { switchNetwork } = useSwitchNetwork();

  const { signTypedDataAsync } = useSignTypedData({
    domain,
    message: {
      name: "",
      timestamp: 0,
      owner: address,
    },
    primaryType: "UserNameProof",
    types,
  });

  const handleSubmit = async () => {
    if (!address || input === fname || !switchNetwork) return;
    setIsLoading(true);
    const transfer = await fetch(
      `https://fnames.farcaster.xyz/transfers/current?name=${input}`
    );
    if (transfer.ok) {
      setIsLoading(false);
      setError("Username is already taken.");
      return;
    }

    await switchNetwork(1);

    if (fname) {
      const message1 = {
        name: fname,
        owner: address,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const signature1 = await signTypedDataAsync({
        primaryType: "UserNameProof",
        domain,
        types,
        message: message1,
      });

      const submission1 = await fetch(
        `https://fnames.farcaster.xyz/transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...message1,
            signature: signature1,
            from: fid,
            to: 0,
            fid,
          }),
        }
      );
    }

    const message2 = {
      name: input,
      owner: address,
      timestamp: Math.floor(Date.now() / 1000),
    };

    const signature2 = await signTypedDataAsync({
      primaryType: "UserNameProof",
      domain,
      types,
      message: message2,
    });

    const submission2 = await fetch(`https://fnames.farcaster.xyz/transfers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...message2,
        signature: signature2,
        from: 0,
        to: fid,
        fid,
      }),
    });

    if (submission2.ok) {
      window.location.reload();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-1 mt-4 ml-2">
      <div className="font-semibold">Change Username</div>
      <div className="text-sm text-zinc-500">
        You can only change your username if you are logged in with your custody
        wallet.
      </div>
      <div className="flex flex-row space-x-2 max-w-lg">
        <Input
          placeholder="flink"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!primary}
        />
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button size="sm">Accept</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                You are changing your username to{" "}
                <b className="text-foreground">{input}</b>. This will make your
                previous username available for anyone to claim.
                <div className="font-semibold mt-2 text-foreground">
                  Note: You will need to sign both messages to change your
                  username
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                onClick={() => setOpen(false)}
                disabled={isLoading}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={input === fname || isLoading || !primary}
              >
                {isLoading ? <LoadingIcon /> : "Accept"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="text-sm text-red-500">{error}</div>
    </div>
  );
};
