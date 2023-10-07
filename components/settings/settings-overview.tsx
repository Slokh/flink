"use client";

import { useUser } from "@/context/user";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AddAccount, AddSigner } from "../auth-button";
import { SettingsNavigation } from "../navigation/settings-navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const SettingsOverview = () => {
  const { user, custody, isLoading } = useUser();

  if (isLoading) return <></>;

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
        {user?.fid !== custody?.fid && (
          <div className="text-sm text-yellow-500">
            This account is not custodied by this wallet. Limited settings
            available.{" "}
            <Dialog>
              <DialogTrigger className="underline">Learn more</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>What is a custodied account?</DialogTitle>
                  <div className="text-sm text-muted-foreground">
                    Every Farcaster account has a Farcaster ID, or fid, that is
                    issued and managed on-chain via the IdRegistry on Optimism.
                    The Ethereum address that owns the fid is known as the
                    user&apos;s custody address. Certain account settings must
                    be managed on-chain, which can only be done by the custody
                    address. If you are not the custody address for this
                    account, you will not be able to manage these settings.
                  </div>
                  <div className="text-sm font-semibold pt-4">
                    For Warpcast users:
                  </div>
                  <div className="text-sm text-muted-foreground">
                    When signing up with Warpcast, a new Etherum account is
                    created for you during onboarding as your custody account.
                    In order for you to manage your on-chain settings in other
                    applications, you will need to export your recovery phrase
                    into your own wallet. To do this:
                  </div>
                  <div className="text-sm text-muted-foreground ml-1">
                    1. Open up the Warpcast app and go to the settings page.
                  </div>
                  <div className="text-sm text-muted-foreground ml-1">
                    2. Go to &ldquo;Advanced&rdquo; and click on &ldquo;Reveal
                    recovery phrase&rdquo;.
                  </div>
                  <div className="text-sm text-muted-foreground ml-1">
                    3. Enter this recovery phrase into your wallet of choice.
                  </div>
                  <div className="text-sm text-muted-foreground ml-1">
                    4. Log out of flink.fyi and reconnect using this wallet.
                  </div>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
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
