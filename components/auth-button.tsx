/* eslint-disable @next/next/no-img-element */
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { FarcasterUser } from "@/lib/types";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookmarkIcon,
  ExclamationTriangleIcon,
  GearIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { useContractWrite, useSwitchNetwork } from "wagmi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { encodeAbiParameters, parseAbiItem } from "viem";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { CONTRACTS } from "@/lib/contracts";
import { MoonIcon, SunIcon, DesktopIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

const AuthUser = ({
  user,
  withDropdown,
}: {
  user: FarcasterUser;
  withDropdown?: boolean;
}) => (
  <div className="flex flex-row items-center space-x-1">
    <Avatar className="h-6 w-6">
      <AvatarImage src={user?.pfp} className="object-cover" />
      <AvatarFallback>?</AvatarFallback>
    </Avatar>
    <div className="font-semibold text-sm">{user?.fname}</div>
    {withDropdown && <div className="font-semibold text-sm">▾</div>}
  </div>
);

export const AuthButton = () => {
  const {
    user,
    custody: primary,
    users,
    changeUser,
    isLoading,
    logout,
  } = useUser();
  const { authState, verifyMessage } = useAuth();
  const { openConnectModal } = useConnectModal();
  const [clickedConnect, setClickedConnect] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { setTheme, theme } = useTheme();

  const handleConnect = () => {
    setClickedConnect(true);
    if (openConnectModal) openConnectModal();
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await verifyMessage();
    } catch (e) {}
    setVerifying(false);
  };

  useEffect(() => {
    if (authState === UserAuthState.CONNECTED && clickedConnect) {
      verifyMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, clickedConnect]);

  if (authState === UserAuthState.DISCONNECTED) {
    return (
      <Button
        onClick={handleConnect}
        className="font-semibold rounded-md bg-foreground text-background p-2 pr-3 pl-3 text-center h-8"
      >
        Connect
      </Button>
    );
  } else if (authState === UserAuthState.CONNECTED && !verifying) {
    return (
      <Button
        onClick={handleVerify}
        className="font-semibold rounded-md bg-foreground text-background p-2 pr-3 pl-3 text-center h-8"
      >
        Log in
      </Button>
    );
  } else if (authState === UserAuthState.UNKNOWN || isLoading || verifying) {
    return (
      <div className="font-semibold rounded-md bg-foreground text-background p-2 pr-3 pl-3 text-center h-8">
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
                <AvatarImage src={user?.pfp} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="font-semibold text-sm">{user?.fname}</div>
            </>
          ) : primary ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={primary.pfp} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="font-semibold text-sm">{primary?.fname}</div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <ExclamationTriangleIcon className="text-yellow-500 w-4 h-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      flink.fyi has not been enabled for this Farcaster account
                      yet.
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <div>No account</div>
          )}
          <div className="font-semibold text-sm">▾</div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {user ? (
          <>
            <DropdownMenuLabel>Switch account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={user.fid?.toString()}
              onValueChange={changeUser}
            >
              {users.map((u) => (
                <DropdownMenuRadioItem
                  className="cursor-pointer"
                  value={u.fid?.toString()}
                  key={u.fid}
                >
                  <AuthUser user={u} />
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        ) : primary ? (
          <div />
        ) : (
          <div />
        )}
        {primary?.requiresSigner && <AddSigner />}
        {!primary && (
          <Link
            href={`/signup`}
            className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-border"
          >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              <PlusIcon className="h-4 w-4 fill-current" />
            </span>
            Create account
          </Link>
        )}
        <AddAccount />
        {!primary && <TransferAccount />}
        <DropdownMenuSeparator />
        {user?.fname && (
          <Link
            href={`/${user?.fname}`}
            className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-border"
          >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              <PersonIcon className="h-4 w-4 fill-current" />
            </span>
            Profile
          </Link>
        )}
        <Link
          href={`/bookmarks`}
          className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-border"
        >
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <BookmarkIcon className="h-4 w-4 fill-current" />
          </span>
          Bookmarks
        </Link>
        <Link
          href={`/settings`}
          className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-border"
        >
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <GearIcon className="h-4 w-4 fill-current" />
          </span>
          Settings
        </Link>
        <div
          onClick={() =>
            setTheme(
              theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
            )
          }
          className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-border"
        >
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            {theme === "light" ? (
              <SunIcon className="h-4 w-4 fill-current" />
            ) : theme === "dark" ? (
              <MoonIcon className="h-4 w-4 fill-current" />
            ) : theme === "system" ? (
              <DesktopIcon className="h-4 w-4 fill-current" />
            ) : (
              <></>
            )}
          </span>
          {`${theme?.charAt(0).toUpperCase()}${theme?.slice(1)}`}
        </div>
        <DropdownMenuItem
          className="cursor-pointer text-red-500"
          onClick={logout}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const AddSigner = () => {
  const [open, setOpen] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>();
  const { addNewUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const { switchNetworkAsync } = useSwitchNetwork();

  const { writeAsync } = useContractWrite({
    address: CONTRACTS.KEY_REGISTRY_ADDRESS,
    abi: [
      parseAbiItem(
        "function add(uint32 keyType, bytes calldata key, uint8 metadataType, bytes calldata metadata) external"
      ),
    ],
    functionName: "add",
  });

  const write = async () => {
    if (!switchNetworkAsync || !writeAsync) return;

    try {
      setIsLoading(true);
      await switchNetworkAsync(CONTRACTS.NETWORK);

      const res = await fetch(`/api/auth/signer/generate`);
      const {
        appFid,
        signature,
        deadline,
        address,
        signerPublicKey,
        signerUuid,
      }: {
        appFid: number;
        signature: `0x${string}`;
        deadline: number;
        address: `0x${string}`;
        signerPublicKey: `0x${string}`;
        signerUuid: string;
        signerStatus: string;
      } = await res.json();

      await writeAsync({
        args: [
          1,
          signerPublicKey,
          1,
          encodeAbiParameters(
            [
              {
                components: [
                  {
                    type: "uint256",
                    name: "requestFid",
                  },
                  {
                    type: "address",
                    name: "requestSigner",
                  },
                  {
                    type: "bytes",
                    name: "signature",
                  },
                  {
                    type: "uint256",
                    name: "deadline",
                  },
                ],
                name: "signedKey",
                type: "tuple",
              },
            ],
            [
              {
                requestFid: BigInt(appFid),
                requestSigner: address,
                signature,
                deadline: BigInt(deadline),
              },
            ]
          ),
        ],
      });
      setPollInterval(
        setInterval(async () => {
          const res = await fetch(`/api/auth/signer/${signerUuid}`);
          const data = await res.json();
          if (!data?.fid) return;
          await addNewUser(data.fid.toString());
          setOpen(false);
          window.location.reload();
        }, 2000)
      );
    } catch (e) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      write();
    } else if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-border w-full">
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <ExclamationTriangleIcon className="text-yellow-500 w-4 h-4" />
        </span>
        Enable flink
      </AlertDialogTrigger>
      <AlertDialogContent>
        <div className="flex flex-col items-center space-y-2">
          <div className="font-semibold">
            Please confirm the transaction in your wallet and wait...
          </div>
          <div className="text-sm">
            This modal will close automatically when the process is complete.
          </div>
          {isLoading ? (
            <Loading />
          ) : (
            <div className="flex flex-row space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={write}>Enable flink</Button>
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const AddAccount = () => {
  const [open, setOpen] = useState(false);
  const [signer, setSigner] = useState<SignerState | undefined>();
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>();
  const { addNewUser } = useUser();

  const watchForLatestSigner = async () => {
    const res = await fetch(`/api/auth/signer/${signer?.signerUuid}`);
    const data = await res.json();
    if (!data?.fid) return;
    await addNewUser(data.fid.toString());
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
      <DialogTrigger className="relative w-full flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-border">
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <img src="/warpcast.png" alt="warpcast" />
        </span>
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

export const TransferAccount = () => (
  <Link
    href={`/settings/advanced`}
    className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-border"
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ArrowRightIcon className="h-4 w-4 fill-current" />
    </span>
    Transfer account
  </Link>
);
