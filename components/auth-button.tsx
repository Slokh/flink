"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SignerState, UserAuthState, useAuth } from "@/context/auth";
import QRCode from "qrcode.react";
import { Loading } from "./loading";
import { useUser } from "@/context/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { FarcasterUser } from "@/lib/types";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const AuthUser = ({
  user,
  withDropdown,
}: {
  user: FarcasterUser;
  withDropdown?: boolean;
}) => (
  <div className="flex flex-row items-center space-x-1">
    <Avatar className="h-6 w-6">
      <AvatarImage src={user.pfp} className="object-cover" />
      <AvatarFallback>?</AvatarFallback>
    </Avatar>
    <div className="font-semibold text-sm">{user?.fname}</div>
    {withDropdown && <div className="font-semibold text-sm">▾</div>}
  </div>
);

export const AuthButton = () => {
  const { user, users, changeUser, isLoading } = useUser();
  const { authState, verifyMessage } = useAuth();
  const { openConnectModal } = useConnectModal();

  if (authState === UserAuthState.DISCONNECTED) {
    return (
      <Button
        onClick={openConnectModal}
        className="font-semibold rounded-md bg-foreground text-background p-2 pr-3 pl-3 text-center h-8"
      >
        Connect
      </Button>
    );
  } else if (authState === UserAuthState.CONNECTED) {
    return (
      <Button
        onClick={verifyMessage}
        className="font-semibold rounded-md bg-foreground text-background p-2 pr-3 pl-3 text-center h-8"
      >
        Log in
      </Button>
    );
  } else if (authState === UserAuthState.UNKNOWN || isLoading) {
    return (
      <div
        onClick={verifyMessage}
        className="font-semibold rounded-md bg-foreground text-background p-2 pr-3 pl-3 text-center h-8"
      >
        <Loading />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex flex-row items-center space-x-1 p-1 h-8">
          {user ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.pfp} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="font-semibold text-sm">{user?.fname}</div>
            </>
          ) : (
            <div>No account</div>
          )}
          <div className="font-semibold text-sm">▾</div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {user && (
          <>
            <DropdownMenuLabel>Switch account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={user.fid.toString()}
              onValueChange={changeUser}
            >
              {users.map((u) => (
                <DropdownMenuRadioItem value={u.fid.toString()} key={u.fid}>
                  <AuthUser user={u} />
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <AddAccount />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AddAccount = () => {
  const [open, setOpen] = useState(false);
  const [signer, setSigner] = useState<SignerState | undefined>();
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>();
  const { addNewUser } = useUser();

  const watchForLatestSigner = async () => {
    const res = await fetch(`/api/auth/signer/${signer?.signerUuid}`);
    const data = await res.json();
    if (!data?.fid) return;
    addNewUser(data.fid.toString());
    setOpen(false);
  };

  useEffect(() => {
    const handle = async () => {
      const res = await fetch(`/api/auth/signer`);
      setSigner(await res.json());
    };
    handle();
  }, []);

  useEffect(() => {
    if (open) {
      setPollInterval(setInterval(watchForLatestSigner, 2000));
    } else if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full cursor-pointer flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
        Add account
      </DialogTrigger>
      <DialogContent>
        {signer?.signerApprovalUrl ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="font-semibold">
              Sign in using Warpcast by scanning this QR code
            </div>
            <QRCode value={signer.signerApprovalUrl} />
            <a
              href={signer.signerApprovalUrl}
              className="text-xs text-muted-foreground"
            >
              Click for link
            </a>
            <div className="text-xs text-muted-foreground">
              This modal will close automatically once you are logged in.
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </DialogContent>
    </Dialog>
  );
};
