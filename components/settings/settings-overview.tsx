"use client";

import { useUser } from "@/context/user";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AddAccount, TransferAccount } from "../auth-button";
import { SettingsNavigation } from "../navigation/settings-navigation";
import { usePathname } from "next/navigation";

export const SettingsOverview = () => {
  const { user, custody, isLoading } = useUser();
  const pathname = usePathname();

  if (!custody && !user && !isLoading) {
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

  return <SettingsNavigation />;
};
