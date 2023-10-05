"use client";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useSignTypedData } from "wagmi";
import { Loading } from "../loading";
import { TransferRequest } from "@/lib/types";
import { formatDistanceStrict } from "date-fns";
import { useUser } from "@/context/user";

const ID_REGISTRY_ADDRESS = "0x00000000FcAf86937e41bA038B4fA40BAA4B780A";

// Define the EIP-712 domain
const domain = {
  name: "Farcaster IdRegistry",
  version: "1",
  chainId: 10,
  verifyingContract: ID_REGISTRY_ADDRESS,
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
  return <TransferOwnership />;
};

const TransferOwnership = () => {
  const { primary, isLoading } = useUser();

  if (isLoading) return <Loading />;
  if (primary) return <TransferOwnershipAccept />;
  return <TransferOwnershipCreate />;
};

const TransferOwnershipAccept = () => {
  const [transferReqeusts, setTransferRequests] = useState<TransferRequest[]>(
    []
  );

  useEffect(() => {
    const handle = async () => {
      const res = await fetch(`/api/auth/transfers/requests`);
      const { transferRequests } = await res.json();
      setTransferRequests(transferRequests);
    };
    handle();
  }, []);

  return (
    <div className="mt-8 mx-2 max-w-md">
      <div className="text-xl font-semibold">Accept Ownership Transfers</div>
      <div className="text-zinc-500 text-sm">
        The following requests have been made to transfer ownership of your
        Farcaster account.
      </div>
      {transferReqeusts.map(({ to }) => (
        <div
          key={to}
          className="flex flex-row items-center p-1 pt-2 justify-between"
        >
          <div className="text-sm">{to}</div>
          <Button size="sm">Accept</Button>
        </div>
      ))}
    </div>
  );
};

const TransferOwnershipCreate = () => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<TransferRequest | undefined>(
    undefined
  );

  const { signTypedDataAsync } = useSignTypedData({
    domain,
    message: {
      fid: input,
      to: ID_REGISTRY_ADDRESS,
      nonce: 0,
      deadline: 0,
    },
    primaryType: "Transfer",
    types,
  });

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
          to: ID_REGISTRY_ADDRESS,
          nonce: Math.floor(Math.random() * 1000000),
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
    <div className="mt-8 mx-2 max-w-md">
      <div className="text-xl font-semibold">Request Ownership Transfers</div>
      <div className="text-zinc-500 text-sm">
        This wallet currently does not own a Farcaster account. You can initiate
        a request to transfer one to this wallet. Creating a new transfer
        request will replace any pending request.
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
          <div className="text-zinc-500 text-sm">
            Please connect with the wallet that owns this account to complete
            the transfer.
          </div>
          <div className="mt-2 flex flex-row justify-between items-center">
            <div className="flex flex-row space-x-1 items-center">
              <div className="font-semibold">{pending.fname}</div>
              <div className="text-zinc-500 text-sm">{`(fid: ${pending.fid})`}</div>
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
