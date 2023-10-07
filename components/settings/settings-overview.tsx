"use client";

import { useUser } from "@/context/user";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AddAccount, AddSigner, TransferAccount } from "../auth-button";
import { SettingsNavigation } from "../navigation/settings-navigation";
import { usePathname } from "next/navigation";
import Loading from "@/app/loading";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const SettingsOverview = () => {
  const { user, custody, isLoading } = useUser();
  const pathname = usePathname();

  if (isLoading) return <Loading />;

  if (!custody && !user) {
    return (
      <div className="flex flex-col px-2 space-y-2 mb-2">
        <Alert>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            No imported accounts
          </AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            You don&apos;t currently have any accounts linked to this wallet.
            You can import an account from Warpcast by clicking the button
            below.
            <div className="border rounded w-32 mt-2">
              <AddAccount />
            </div>
          </AlertDescription>
        </Alert>
        {!pathname.endsWith("/advanced") && (
          <Alert>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              No custodied account
            </AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              You don&apos;t currently have an account custodied by this wallet.
              A custodied account is one that is managed on-chain by this
              Ethereum account. A wallet can only custody at most one account.
              You can transfer an existing Farcaster account to this wallet by
              clicking the button below.
              <div className="border rounded w-40 mt-2">
                <TransferAccount />
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col px-2">
        <div className="flex flex-row space-x-1 items-center">
          <div className="text-sm font-semibold">Selected Account: </div>
          {user || custody ? (
            <>
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={user?.pfp || custody?.pfp}
                  className="object-cover"
                />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="text-sm">{`@${
                user?.fname || custody?.fname
              }`}</div>
            </>
          ) : (
            <div className="text-sm">None</div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Your currently selected Farcaster account.
        </div>
      </div>
      {custody && user && custody.fid !== user?.fid && (
        <div className="flex flex-col px-2">
          <div className="flex flex-row space-x-1 items-center">
            <div className="text-sm font-semibold">Custody Account: </div>
            <Avatar className="h-5 w-5">
              <AvatarImage src={custody.pfp} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="text-sm">{`@${custody.fname}`}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            The Farcaster account custodied by this wallet address.
          </div>
        </div>
      )}
      {!user && (
        <div className="flex flex-col px-2 space-y-2 mb-2">
          <Alert>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              No signer available
            </AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              You need to add a signer to your account before you can manage
              your settings.
              <div className="border rounded w-32 mt-2">
                <AddSigner />
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <SettingsNavigation />
    </>
  );
};
