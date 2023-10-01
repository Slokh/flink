"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckIcon } from "@radix-ui/react-icons";
import { UserAuthState, useAuth } from "@/context/auth";
import QRCode from "qrcode.react";
import { Loading } from "./loading";
import Link from "next/link";
import { useUser } from "@/context/user";

export const AuthButton = () => {
  const [open, setOpen] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>();
  const {
    address,
    authState,
    verifyMessage,
    signerApprovalUrl,
    watchForLatestSigner,
    isVerifying,
  } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (authState === UserAuthState.NEEDS_APPROVAL && open) {
      setPollInterval(setInterval(watchForLatestSigner, 2000));
    } else if (
      (authState === UserAuthState.LOGGED_IN || !open) &&
      pollInterval
    ) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, open]);

  if (authState === UserAuthState.UNKNOWN) {
    return (
      <div className="font-semibold rounded-md bg-foreground text-background p-2 pr-3 pl-3 text-center">
        <Loading />
      </div>
    );
  } else if (authState === UserAuthState.LOGGED_IN) {
    return user ? (
      <Link href={`/${user?.fname}`}>
        <div className="font-semibold text-sm">{`@${user?.fname}`}</div>
      </Link>
    ) : (
      <div className="font-semibold rounded-md bg-foreground text-background p-2 pr-3 pl-3 text-center">
        <Loading />
      </div>
    );
  } else if (authState === UserAuthState.DISCONNECTED) {
    return (
      <ConnectButton
        label="Connect"
        chainStatus="none"
        showBalance={false}
        accountStatus="address"
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="font-semibold rounded-md bg-foreground text-background p-2 pr-3 pl-3 text-center">
        Log in
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authenticate to flink.fyi</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Step
          step={1}
          title="Connect your wallet"
          description={
            <>
              You are connected to{" "}
              <span className="font-semibold text-foreground">
                {`${address?.substring(0, 6)}...`}
              </span>
              .
            </>
          }
          isComplete={true}
        />
        <Step
          step={2}
          title="Verify your address"
          description="Sign a message to verify you own this address."
          isComplete={authState >= UserAuthState.VERIFIED}
          action={
            authState === UserAuthState.CONNECTED ? (
              <Button
                onClick={verifyMessage}
                className="font-bold rounded-md h-[40px] whitespace-nowrap"
                disabled={isVerifying}
              >
                {isVerifying ? <Loading /> : "Verify"}
              </Button>
            ) : (
              <></>
            )
          }
        />
        <Step
          step={3}
          title="Sign in with Farcaster"
          description="Scan the QR code to sign in with Farcaster using Warpcast."
          isComplete={false}
          content={
            authState === UserAuthState.NEEDS_APPROVAL && signerApprovalUrl ? (
              <div className="flex flex-col items-center space-y-1">
                <QRCode value={signerApprovalUrl} />
                <a
                  href={signerApprovalUrl}
                  className="text-xs text-muted-foreground"
                >
                  Click for link
                </a>
                <div className="text-xs text-muted-foreground">
                  This modal will close automatically once you are logged in.
                </div>
              </div>
            ) : (
              <></>
            )
          }
        />
      </DialogContent>
    </Dialog>
  );
};

const Step = ({
  step,
  title,
  description,
  action,
  content,
  isComplete,
}: {
  step: number;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  content?: React.ReactNode;
  isComplete: boolean;
}) => (
  <div className="flex flex-col space-y-2">
    <div className="flex flex-row space-x-2 items-center pb-2 sm:pb-0">
      <div>
        {isComplete ? (
          <div className="flex font-semibold rounded-full bg-foreground w-8 h-8 justify-center items-center text-background">
            {step}
          </div>
        ) : (
          <div className="flex font-semibold rounded-full border-2 border-foreground w-8 h-8 justify-center items-center">
            {step}
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex flex-row space-x-1 items-center">
          <div className="font-semibold">{title}</div>
          {isComplete && (
            <div className="text-green-500">
              <CheckIcon />
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      {action}
    </div>
    {content}
  </div>
);
