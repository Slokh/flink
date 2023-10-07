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
import { AddSigner } from "../auth-button";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const { isLoading } = useUser();
  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col md:flex-row px-4 py-2 space-y-4 md:space-x-4 md:space-y-0 space-x-0">
      <div className="w-full max-w-xl">
        <Profile />
      </div>
      <div className="w-full max-w-xl">
        <ChangeUsername />
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, custody, isLoading } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display: "",
      bio: "",
      pfp: "",
    },
  });

  useEffect(() => {
    if (user || custody) {
      form.reset({
        display: user?.display || custody?.display || "",
        bio: user?.bio || custody?.bio || "",
        pfp: user?.pfp || custody?.pfp || "",
      });
    }
  }, [user, form, custody]);

  if (!custody && !user && !isLoading) {
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
      <Alert>
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle className="font-semibold">Not supported</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          Modifying profile settings are currently not supported.
        </AlertDescription>
      </Alert>
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

const ChangeUsername = () => {
  const [open, setOpen] = useState(false);
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const { user, custody, isLoading } = useUser();
  const [input, setInput] = useState(custody?.fname || "");
  const { switchNetwork } = useSwitchNetwork();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setError("No signer available");
    } else if (!custody || user.fid !== custody.fid) {
      setError(
        "You can only change the username with the wallet custodying the account."
      );
    } else {
      setError("");
    }
  }, [custody, user]);

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
    if (!address || input === custody?.fname || !switchNetwork) return;
    setLoading(true);
    try {
      await switchNetwork(1);

      if (custody?.fname) {
        const message1 = {
          name: custody?.fname,
          owner: address,
          timestamp: Math.floor(Date.now() / 1000),
        };

        const signature1 = await signTypedDataAsync({
          primaryType: "UserNameProof",
          domain,
          types,
          message: message1,
        });

        await fetch(`https://fnames.farcaster.xyz/transfers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...message1,
            signature: signature1,
            from: custody?.fid,
            to: 0,
            fid: custody?.fid,
          }),
        });
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

      const submission2 = await fetch(
        `https://fnames.farcaster.xyz/transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...message2,
            signature: signature2,
            from: 0,
            to: custody?.fid,
            fid: custody?.fid,
          }),
        }
      );

      if (submission2.ok) {
        window.location.reload();
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleChange = async () => {
    const current = await fetch(
      `https://fnames.farcaster.xyz/transfers/current?name=${custody?.fname}`
    );
    const {
      transfer: { timestamp },
    } = await current.json();
    if (timestamp && Date.now() - timestamp * 1000 < 28 * 24 * 60 * 60 * 1000) {
      setLoading(false);
      setError("You can only change your username once every 28 days.");
      return;
    }

    const transfer = await fetch(
      `https://fnames.farcaster.xyz/transfers/current?name=${input}`
    );
    if (transfer.ok) {
      setLoading(false);
      setError("Username is already taken.");
      return;
    }

    setOpen(true);
  };

  if (!custody && !user && !isLoading) {
    return <></>;
  }

  return (
    <div className="flex flex-col space-y-1">
      <div className="font-semibold text-xl">Change Username</div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>More info</AccordionTrigger>
          <AccordionContent>
            <div className="text-sm text-muted-foreground">
              A username can be used to identify or mention an account on
              Farcaster. Users can connect many names to an account but only one
              can be active at any given time. Usernames come in two formats:
              fnames and ENS names.
            </div>
            <div className="text-sm text-muted-foreground pt-2">
              <b className="text-foreground">fnames</b> - These are unique
              usernames issued off-chain by the Farcaster Name Registry.
              Registering a username requires a signed message from the
              Farcaster account&apos;s custody address. Fnames have a usage
              policy to prevent squatting and impersonation and can be
              reclaimed. For users who do not want to be subject to this policy,
              you can use ENS.
            </div>
            <div className="text-sm text-muted-foreground pt-2">
              <b className="text-foreground">ENS names</b> - For a purely
              decentralized approach to usernames, ENS names can be used as an
              alternative to fnames. You can use an ENS name from any of the
              connected wallets to your Farcaster account.{" "}
              <b className="text-foreground">
                Currently, flink.fyi does not support ENS names.
              </b>
            </div>
            <div className="text-sm font-semibold pt-4">
              How do fnames work?
            </div>
            <div className="text-sm text-muted-foreground">
              fnames are entirely off-chain. Thefore, they are managed via
              signatures from the custody address of the Farcaster account. This
              means that you can only change your fname if you have access to
              the custody address of your Farcaster account. If you lose access
              to your custody address, you will not be able to change your
              fname. fnames can only be changed once every 28 days.
            </div>
            <div className="text-sm text-muted-foreground">
              1. If you currently have an fname associated with your account,
              you will be prompted to deregister it. This will make your
              previous fname available for anyone to use.
            </div>
            <div className="text-sm text-muted-foreground">
              2. You will be prompted to register your new fname.
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="flex flex-col space-y-1 pt-2">
        <div className="flex flex-row space-x-2">
          <Input
            placeholder="flink"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || !user || !custody || custody.fid !== user.fid}
          />
          <AlertDialog open={open} onOpenChange={setOpen}>
            <Button
              size="sm"
              onClick={handleChange}
              disabled={
                input === custody?.fname ||
                loading ||
                !user ||
                !custody ||
                custody.fid !== user.fid
              }
            >
              Change
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <div className="text-sm text-muted-foreground">
                  You are changing your username to{" "}
                  <b className="text-foreground">{input}</b>. This will make
                  your previous username available for anyone to claim and
                  prevent you from changing your name for the next 28 days.
                  <div className="font-semibold mt-2 text-foreground">
                    Note: You will need to sign both messages to change your
                    username
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    input === custody?.fname ||
                    loading ||
                    !user ||
                    !custody ||
                    custody.fid !== user.fid
                  }
                >
                  {loading ? <LoadingIcon /> : "Change"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    </div>
  );
};
