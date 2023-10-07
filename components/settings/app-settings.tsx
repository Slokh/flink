"use client";

import { useUser } from "@/context/user";
import { FarcasterUser } from "@/lib/types";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { ExclamationTriangleIcon, TrashIcon } from "@radix-ui/react-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Loading from "@/app/loading";
import { format } from "date-fns";
import { useContractWrite } from "wagmi";
import { parseAbiItem } from "viem";
import { Loading as LoadingIcon } from "@/components/loading";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

const KEY_REGISTRY_ADDRESS = "0x00000000fC9e66f1c6d86D750B4af47fF0Cc343d";

type SignerData = {
  address: `0x${string}`;
  ok: boolean;
  signers: {
    fid: number;
    key: `0x${string}`;
    user: FarcasterUser;
    transactionHash: string;
    timestamp: number;
  }[];
};

const formatHash = (address: string) =>
  `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

export const AppSettings = () => {
  const { isLoading } = useUser();

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col md:flex-row px-4 py-2 space-y-4 md:space-x-4 md:space-y-0 space-x-0">
      <div className="flex flex-col space-y-1 max-w-xl">
        <div className="font-semibold text-xl">Manage Connected Apps</div>
        <div className="text-sm text-muted-foreground">
          Farcaster allows you to use as many applications as you want with the
          same underlying account. In order to authorize different applications
          without giving up control of your Farcaster identity, signers are
          used. Signers delegate permissions to post to Farcaster on a
          user&apos;s behalf to others. This requires an on-chain transaction to
          the KeyRegistry on Optimism.
        </div>
        <div className="text-sm text-muted-foreground">
          Here you can manage your existing app connections and the signers that
          are being used for those apps. If you no longer want to give an app
          permission to post on behalf of you, you can remove that connection by
          submitting a transaction on-chain here.
        </div>
      </div>
      <div className="max-w-xl">
        <Apps />
      </div>
    </div>
  );
};

const Apps = () => {
  const { user, custody, isLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SignerData | undefined>(undefined);

  useEffect(() => {
    const handle = async () => {
      const res = await fetch(`/api/auth/${user?.fid || custody?.fid}/signers`);
      setData(await res.json());
      setLoading(false);
    };
    if (user?.fid || custody?.fid) {
      handle();
    } else {
      setLoading(false);
    }
  }, [custody, user?.fid]);

  if (!custody && !user && !isLoading) {
    return <></>;
  }

  return (
    <div className="flex flex-col space-y-2 p-2">
      {data?.signers.map(({ key, fid, user, transactionHash, timestamp }) => (
        <div key={key} className="flex flex-row p-2 items-center">
          <div className="w-80">
            <Link
              href={`/${user?.fname}`}
              className="flex flex-row space-x-2 items-center text-sm"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.pfp} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <div className="flex flex-row space-x-1">
                  <div>{user?.display || user?.fname || user?.fid || fid}</div>
                  <div className="text-muted-foreground">{`@${user?.fname}`}</div>
                </div>
                <div className="text-purple-600 dark:text-purple-400">
                  {formatHash(key)}
                </div>
              </div>
            </Link>
          </div>
          <div className="w-80 hidden sm:flex">
            <Link
              href={`https://optimistic.etherscan.io/tx/${transactionHash}`}
              target="_blank"
              className="flex flex-col space-y-1 text-sm"
            >
              <div>{`Added on ${format(
                new Date(timestamp * 1000),
                "MMM d, yyyy"
              )}`}</div>
              <div className="text-purple-600 dark:text-purple-400">
                {formatHash(transactionHash)}
              </div>
            </Link>
          </div>
          {data.ok && user.fname !== "warpcast" && (
            <RemoveButton signerKey={key} />
          )}
        </div>
      ))}
    </div>
  );
};

const RemoveButton = ({ signerKey }: { signerKey: `0x${string}` }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { writeAsync, isSuccess } = useContractWrite({
    address: KEY_REGISTRY_ADDRESS,
    abi: [parseAbiItem("function remove(bytes calldata key) external")],
    functionName: "remove",
  });

  const removeSigner = async (key: `0x${string}`) => {
    setIsLoading(true);
    try {
      await writeAsync({
        args: [key],
      });
    } catch (e) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handle = async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const res = await fetch(`/api/auth/signer/key/${signerKey}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOpen(false);
        window.location.reload();
      } else {
        setIsLoading(false);
      }
    };
    if (isSuccess) {
      handle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>
        <div className="hover:bg-red-500/30 hover:text-red-500 p-1 rounded-full transition">
          <TrashIcon className="w-6 h-6 text-red-500 cursor-pointer" />
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will remove this signer from your
            account and any casts associated with this signer will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => removeSigner(signerKey)}
            disabled={isLoading}
          >
            {isLoading ? <LoadingIcon /> : "Remove"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
