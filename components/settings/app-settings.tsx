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
import { AddAccount } from "../auth-button";

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
  const { user, primary, isLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SignerData | undefined>(undefined);

  useEffect(() => {
    const handle = async () => {
      const res = await fetch(`/api/auth/${user?.fid || primary?.fid}/signers`);
      setData(await res.json());
      setLoading(false);
    };
    handle();
  }, [primary, user?.fid]);

  if (isLoading || loading) return <Loading />;
  if (!data) return <></>;
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

  return (
    <div className="flex flex-col space-y-2 p-2">
      {!data.ok && (
        <Alert>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            This Farcaster accounter account is managed by{" "}
            <a
              href={`https://optimistic.etherscan.io/address/${data.address}`}
              target="_blank"
              className="text-purple-600 dark:text-purple-400"
            >
              {formatHash(data.address)}
            </a>
          </AlertTitle>
          <AlertDescription className="space-y-1 mt-2">
            <div>
              If this account was created on Warpcast, you will need to export
              your recovery phrase into your own wallet. To do this:
            </div>
            <div className="ml-1">
              1. Open up the Warpcast app and go to the settings page.
            </div>
            <div className="ml-1">
              2. Go to &ldquo;Advanced&rdquo; and click on &ldquo;Reveal
              recovery phrase&rdquo;.
            </div>
            <div className="ml-1">
              3. Enter this recovery phrase into your wallet of choice.
            </div>
            <div className="ml-1">
              4. Log out of flink.fyi and reconnect using this wallet.
            </div>
          </AlertDescription>
        </Alert>
      )}
      {data.signers.map(({ key, fid, user, transactionHash, timestamp }) => (
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
                  <div className="text-zinc-500">{`@${user?.fname}`}</div>
                </div>
                <div className="text-purple-600 dark:text-purple-400">
                  {formatHash(key)}
                </div>
              </div>
            </Link>
          </div>
          <div className="w-80">
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
          {data.ok && <RemoveButton signerKey={key} />}
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
