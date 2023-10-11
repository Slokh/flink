"use client";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  useSignTypedData,
} from "wagmi";
import { Loading } from "../loading";
import { TransferRequest } from "@/lib/types";
import { formatDistanceStrict } from "date-fns";
import { useUser } from "@/context/user";
import { parseAbiItem } from "viem";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Loading as LoadingIcon } from "@/components/loading";
import { CONTRACTS } from "@/lib/contracts";

// Define the EIP-712 domain
const domain = {
  name: "Farcaster IdRegistry",
  version: "1",
  chainId: CONTRACTS.NETWORK,
  verifyingContract: CONTRACTS.ID_REGISTRY_ADDRESS,
} as const;

// Create the EIP-712 typed data
const types = {
  Transfer: [
    { name: "fid", type: "uint256" },
    { name: "to", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

export const AdvancedSettings = () => {
  const { user, custody, isLoading } = useUser();

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col md:flex-row px-4 py-2 space-y-4 md:space-x-4 md:space-y-0 space-x-0">
      <div className="flex flex-col space-y-1 max-w-xl">
        <div className="font-semibold text-xl">Transfer Farcaster Account</div>
        <div className="text-sm text-muted-foreground">
          Every Farcaster account has a Farcaster ID, or fid, that is issued and
          managed on-chain via the IdRegistry on Optimism. The Ethereum account
          that owns the fid is known as the user&apos;s custody address. The fid
          is fully owned by the custody address and can be transferred to
          another addres, so long as the recipient address does not currently
          own another fid.
        </div>
        <div className="text-sm font-semibold pt-4">How does it work?</div>
        <div className="text-sm text-muted-foreground">
          There are two high-level steps to transfer a fid:
        </div>
        <div className="text-sm text-muted-foreground">
          1. Log in with the Etherum wallet that you want to custody the fid.
          Navigate to this page and request an ownership transfer for your fid
          from your current custody address.
        </div>
        <div className="text-sm text-muted-foreground">
          2. Log in with the Etherum wallet that currently custodies the fid.
          Navigate to this page and accept the transfer request from your
          destination custody address. This will require an on-chain transaction
          so make sure your wallet has enough funds for gas costs.
        </div>
        <div className="text-sm font-semibold pt-4">For Warpcast users:</div>
        <div className="text-sm text-muted-foreground">
          When signing up with Warpcast, a new Etherum account is created for
          you during onboarding. However, you may want to transfer this to a
          wallet you regularly use for security (such as a hardware wallet) if
          you plan to primarily use non-Warpcast clients.
        </div>
        <div className="text-sm font-semibold">
          Please note that by transferring your fid, you will break
          functionality for your account in Warpcast. We highly discourage
          Warpcast users from using this feature for now.
        </div>
      </div>
      <div className="max-w-xl">
        {custody ? (
          custody?.fid !== user?.fid ? (
            <div className="text-red-500 text-sm">
              This account can&apos;t be transfered as it&apos;s not custodied
              by this wallet.
            </div>
          ) : (
            <TransferOwnershipAccept />
          )
        ) : (
          <TransferOwnershipCreate />
        )}
      </div>
    </div>
  );
};

const TransferOwnershipAccept = () => {
  const [loading, setLoading] = useState(true);
  const [transferReqeusts, setTransferRequests] = useState<TransferRequest[]>(
    []
  );

  useEffect(() => {
    const handle = async () => {
      const res = await fetch(`/api/auth/transfers/requests`);
      const { transferRequests } = await res.json();
      setTransferRequests(transferRequests);
      setLoading(false);
    };
    handle();
  }, []);

  if (loading) return <></>;

  return (
    <div className="">
      <div className="text-xl font-semibold">Accept Transfer</div>
      <div className="text-muted-foreground text-sm">
        If you would like to transfer your Farcaster account to another wallet,
        you need to log in with that wallet to initiate the transfer.
      </div>
      {transferReqeusts.length > 0 && (
        <div className="text-muted-foreground text-sm">
          The following requests have been made to transfer ownership of your
          Farcaster account.
        </div>
      )}
      {transferReqeusts.map((request) => (
        <div
          key={request.to}
          className="flex flex-row items-center p-1 pt-4 justify-between"
        >
          <div className="flex flex-col w-1/2">
            <div className="text-sm truncate">{request.to}</div>
            <div className="text-muted-foreground text-sm">{`expires in ${formatDistanceStrict(
              new Date(request.deadline * 1000),
              new Date()
            )}`}</div>
          </div>
          <AcceptButton request={request} />
        </div>
      ))}
    </div>
  );
};

const AcceptButton = ({ request }: { request: TransferRequest }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { writeAsync, isSuccess } = useContractWrite({
    address: CONTRACTS.ID_REGISTRY_ADDRESS,
    abi: [
      parseAbiItem(
        "function transfer(address to, uint256 deadline, bytes calldata sig) external"
      ),
    ],
    functionName: "transfer",
  });

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await writeAsync({
        args: [request.to, BigInt(request.deadline), request.signature],
      });
    } catch (e) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handle = async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setOpen(false);
      window.location.reload();
    };
    if (isSuccess) {
      handle();
    }
  }, [isSuccess]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm">Accept</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <div className="text-sm text-muted-foreground">
            This will give full permission over this Farcaster account to the
            wallet that initiated the transfer request.
          </div>
          <div className="text-sm text-destructive">
            Please note that by transferring your account, you will break
            functionality for your account in Warpcast. We highly discourage
            Warpcast users from using this feature for now.
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            onClick={() => setOpen(false)}
            disabled={isLoading}
            variant="outline"
          >
            Cancel
          </Button>
          <Button onClick={handleAccept} disabled={isLoading}>
            {isLoading ? <LoadingIcon /> : "Accept"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const TransferOwnershipCreate = () => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<TransferRequest | undefined>(
    undefined
  );
  const { address } = useAccount();

  const { data: nonce } = useContractRead({
    address: CONTRACTS.ID_REGISTRY_ADDRESS,
    abi: [parseAbiItem("function nonces(address) view returns (uint256)")],
    functionName: "nonces",
    args: address ? [address] : undefined,
  });

  const { signTypedDataAsync } = useSignTypedData();

  const getPending = async () => {
    const res = await fetch(`/api/auth/transfers`);
    const { transferRequest } = await res.json();
    setPending(transferRequest);
  };

  useEffect(() => {
    getPending();
  }, []);

  const handleRequest = async () => {
    setError("");
    setLoading(true);
    try {
      if (!input) {
        setError("Please enter a username");
        setLoading(false);
        return;
      }

      const data = await fetch(`/api/users/${input}`);
      const user = await data.json();
      if (!user?.fid) {
        setError("User does not exist");
        setLoading(false);
        return;
      }

      const deadline = Math.floor(Date.now() / 1000) + 86400;
      const signature = await signTypedDataAsync({
        primaryType: "Transfer",
        domain,
        types,
        message: {
          fid: user.fid,
          to: address,
          nonce,
          deadline,
        },
      });

      const res = await fetch(`/api/auth/transfers`, {
        method: "POST",
        body: JSON.stringify({
          fid: user.fid,
          signature,
          deadline,
          fname: user.fname,
        }),
      });
      if (!res.ok) {
        setLoading(false);
        setError("An unexpected error occurred");
      }

      await getPending();

      setLoading(false);
      setInput("");
    } catch (e) {
      setLoading(false);
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="">
      <div className="text-xl font-semibold">Request Transfer</div>
      <div className="text-muted-foreground text-sm">
        This wallet currently does not custody a Farcaster account. You can
        initiate a request to transfer one to this wallet. Creating a new
        transfer request will replace any pending request.
      </div>
      <div className="mt-2 flex flex-row space-x-2">
        <Input
          placeholder="Farcaster username"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={handleRequest} disabled={loading}>
          {loading ? <Loading /> : "Request"}
        </Button>
      </div>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      {pending && (
        <>
          <div className="mt-4 text-md font-semibold">Pending Transfer</div>
          <div className="text-muted-foreground text-sm">
            Please connect with the wallet that owns this account to complete
            the transfer.
          </div>
          <div className="mt-2 flex flex-row justify-between items-center">
            <div className="flex flex-row space-x-1 items-center">
              <div className="font-semibold">{pending.fname}</div>
              <div className="text-muted-foreground text-sm">{`(fid: ${pending.fid})`}</div>
            </div>
            <div className="text-sm">{`expires in ${formatDistanceStrict(
              new Date(pending.deadline * 1000),
              new Date()
            )}`}</div>
          </div>
        </>
      )}
    </div>
  );
};
