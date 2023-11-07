"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { encodeAbiParameters, isAddress, parseAbiItem } from "viem";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  useNetwork,
  useSignTypedData,
  useSwitchNetwork,
} from "wagmi";
import { Input } from "@/components/ui/input";
import { Loading as LoadingIcon } from "@/components/loading";
import { useUser } from "@/context/user";
import Loading from "../loading";
import {
  ChangeUsername,
  Profile,
} from "@/components/settings/profile-settings";
import { CheckCircledIcon, CheckIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
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
  Register: [
    { name: "to", type: "address" },
    { name: "recovery", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

const signerDomain = {
  name: "Farcaster KeyRegistry",
  version: "1",
  chainId: CONTRACTS.NETWORK,
  verifyingContract: CONTRACTS.KEY_REGISTRY_ADDRESS,
};

const signerTypes = {
  Add: [
    { name: "owner", type: "address" },
    { name: "keyType", type: "uint32" },
    { name: "key", type: "bytes" },
    { name: "metadataType", type: "uint8" },
    { name: "metadata", type: "bytes" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

type Recovery = {
  address: string;
  deadline: number;
  signature: string;
};

type Enable = {
  keyType: number;
  key: string;
  metadataType: number;
  metadata: string;
  nonce?: bigint;
  deadline: number;
  signature: string;
  signerUuid: string;
};

export default function Home() {
  const router = useRouter();
  const { isLoading, custody } = useUser();
  const [recovery, setRecovery] = useState<Recovery>();
  const [enable, setEnable] = useState<Enable>();
  const [fid, setFid] = useState<number>();
  const [username, setUsername] = useState<string>();
  const [disabled, setDisabled] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (custody?.fid) {
      if (custody?.display) {
        setDisabled(true);
      } else if (custody?.fname) {
        setCurrentStep(5);
      } else {
        setCurrentStep(4);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custody]);

  if (isLoading) return <Loading />;

  return (
    <div className="w-full flex flex-col space-y-4 py-2 px-4">
      <div className="text-2xl font-semibold">Signup for Farcaster</div>
      <div className="max-w-lg">
        Signups are currently disabled while Farcaster contracts are upgrading.
        More info at:
      </div>
      <a href="https://github.com/farcasterxyz/protocol/discussions/133">
        https://github.com/farcasterxyz/protocol/discussions/133
      </a>
    </div>
  );

  if (disabled) {
    return (
      <div className="w-full flex flex-col space-y-4 py-2 px-4">
        <div className="text-2xl font-semibold">Signup for Farcaster</div>
        <div className="max-w-lg">
          This wallet address already has a Farcaster account registered to it,
          either link an account using the menu or switch to a different wallet
          to create a new account.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-4 py-2 px-4">
      <div className="text-2xl font-semibold">Signup for Farcaster</div>
      <SetRecoveryAddress
        onSuccess={(r) => setRecovery(r)}
        markDone={currentStep > 1}
      />
      <EnableFlink
        recovery={recovery}
        onSuccess={(r) => setEnable(r)}
        markDone={currentStep > 2}
      />
      <RegisterWithIdRegistry
        recovery={recovery}
        enable={enable}
        onSuccess={(fid) => setFid(fid)}
        markDone={currentStep > 3}
      />
      <RegisterUsername
        fid={fid}
        onSuccess={setUsername}
        markDone={currentStep > 4}
      />
      <SetupProfile
        fname={username}
        onSuccess={() => {
          window.location.href = "/";
        }}
        markDone={currentStep > 5}
      />
    </div>
  );
}

const SetRecoveryAddress = ({
  onSuccess,
  markDone,
}: {
  onSuccess: (r: Recovery) => void;
  markDone: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signTypedDataAsync } = useSignTypedData();
  const { switchNetwork } = useSwitchNetwork();
  const { address } = useAccount();
  const [recoveryAddress, setRecoveryAddress] = useState(address || "");
  const [error, setError] = useState("");
  const [done, setDone] = useState(markDone);

  useEffect(() => {
    setDone(markDone);
  }, [markDone]);

  const { data: nonce } = useContractRead({
    address: CONTRACTS.ID_REGISTRY_ADDRESS,
    abi: [parseAbiItem("function nonces(address) view returns (uint256)")],
    functionName: "nonces",
    args: address ? [address] : undefined,
  });

  const handleSetRecoveryAddress = async () => {
    if (!switchNetwork) return;
    if (!isAddress(recoveryAddress)) {
      setError("Invalid address");
      return;
    }

    try {
      setIsLoading(true);
      await switchNetwork(CONTRACTS.NETWORK);

      const registerDeadline = Math.floor(Date.now() / 1000) + 86400;
      const registerSignature = await signTypedDataAsync({
        primaryType: "Register",
        domain,
        types,
        message: {
          to: address,
          recovery: address,
          nonce,
          deadline: registerDeadline,
        },
      });
      onSuccess({
        address: recoveryAddress,
        deadline: registerDeadline,
        signature: registerSignature,
      });
      setDone(true);
    } catch (e) {
      setError("An unexpected error occurred");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-row space-x-2 max-w-lg">
      <div>
        <div
          className={`border-2 border-foreground rounded-full w-8 h-8 flex justify-center items-center font-semibold text-lg ${
            done ? "bg-foreground text-background" : "p-2"
          }`}
        >
          {done ? <CheckIcon className="w-8 h-8" /> : 1}
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <div>
          <div className="font-semibold">Set your recovery address</div>
          <div className="text-muted-foreground text-sm">
            A <b>recovery address</b> is an address you trust that will be
            allowed to transfer your account to a new wallet in case you lose
            access to your current wallet. This is an off-chain action.
          </div>
        </div>
        <Input
          value={recoveryAddress}
          onChange={(e) => setRecoveryAddress(e.target.value)}
        />
        <div className="flex justify-between">
          <div className="text-sm text-red-500">{error}</div>
          <Button
            onClick={handleSetRecoveryAddress}
            disabled={done || isLoading}
          >
            {isLoading ? <LoadingIcon /> : "Set recovery address"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const EnableFlink = ({
  onSuccess,
  recovery,
  markDone,
}: {
  recovery?: Recovery;
  onSuccess: (r: Enable) => void;
  markDone: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signTypedDataAsync } = useSignTypedData();
  const { switchNetwork } = useSwitchNetwork();
  const { address } = useAccount();
  const [error, setError] = useState("");
  const [done, setDone] = useState(markDone);

  const { data: nonce } = useContractRead({
    address: CONTRACTS.KEY_REGISTRY_ADDRESS,
    abi: [parseAbiItem("function nonces(address) view returns (uint256)")],
    functionName: "nonces",
    args: address ? [address] : undefined,
  });
  useEffect(() => {
    setDone(markDone);
  }, [markDone]);

  const handleEnableFlink = async () => {
    if (!switchNetwork) return;

    try {
      setIsLoading(true);
      await switchNetwork(CONTRACTS.NETWORK);

      const res = await fetch(`/api/auth/signer/generate`);
      const {
        appFid,
        signature,
        deadline,
        address: signerAddress,
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

      const message = {
        owner: address,
        keyType: 1,
        key: signerPublicKey,
        metadataType: 1,
        metadata: encodeAbiParameters(
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
              requestSigner: signerAddress,
              signature,
              deadline: BigInt(deadline),
            },
          ]
        ),
        nonce,
        deadline,
      };

      const enableSignature = await signTypedDataAsync({
        primaryType: "Add",
        domain: signerDomain,
        types: signerTypes,
        message,
      });
      onSuccess({
        ...message,
        signature: enableSignature,
        deadline,
        signerUuid,
      });
      setDone(true);
    } catch (e) {
      setError("An unexpected error occurred");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-row space-x-2 max-w-lg">
      <div>
        <div
          className={`border-2 border-foreground rounded-full w-8 h-8 flex justify-center items-center font-semibold text-lg ${
            done ? "bg-foreground text-background" : "p-2"
          }`}
        >
          {done ? <CheckIcon className="w-8 h-8" /> : 2}
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <div>
          <div className="font-semibold">Enable flink</div>
          <div className="text-muted-foreground text-sm">
            A signer will be added that will allow you to use Farcaster through
            the flink app. This is an off-chain action.
          </div>
        </div>
        <div className="flex justify-between">
          <div className="text-sm text-red-500">{error}</div>
          <Button
            onClick={handleEnableFlink}
            disabled={!recovery || done || isLoading}
          >
            {isLoading ? <LoadingIcon /> : "Enable flink"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const RegisterWithIdRegistry = ({
  recovery,
  enable,
  onSuccess,
  markDone,
}: {
  recovery?: Recovery;
  enable?: Enable;
  onSuccess: (fid: number) => void;
  markDone: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { switchNetwork } = useSwitchNetwork();
  const { address } = useAccount();
  const [error, setError] = useState("");
  const { addNewUser } = useUser();
  const [done, setDone] = useState(markDone);

  const { data } = useContractRead({
    address: CONTRACTS.STORAGE_REGISTRY_ADDRESS,
    abi: [parseAbiItem("function unitPrice() view returns (uint256)")],
    functionName: "unitPrice",
  });
  useEffect(() => {
    setDone(markDone);
  }, [markDone]);

  const { writeAsync } = useContractWrite({
    address: CONTRACTS.BUNDLER_ADDRESS,
    abi: [
      {
        inputs: [
          {
            components: [
              {
                internalType: "address",
                name: "to",
                type: "address",
              },
              {
                internalType: "address",
                name: "recovery",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "deadline",
                type: "uint256",
              },
              {
                internalType: "bytes",
                name: "sig",
                type: "bytes",
              },
            ],
            internalType: "struct IBundler.RegistrationParams",
            name: "registration",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint32",
                name: "keyType",
                type: "uint32",
              },
              {
                internalType: "bytes",
                name: "key",
                type: "bytes",
              },
              {
                internalType: "uint8",
                name: "metadataType",
                type: "uint8",
              },
              {
                internalType: "bytes",
                name: "metadata",
                type: "bytes",
              },
              {
                internalType: "uint256",
                name: "deadline",
                type: "uint256",
              },
              {
                internalType: "bytes",
                name: "sig",
                type: "bytes",
              },
            ],
            internalType: "struct IBundler.SignerParams[]",
            name: "signers",
            type: "tuple[]",
          },
          {
            internalType: "uint256",
            name: "storageUnits",
            type: "uint256",
          },
        ],
        name: "register",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
    ],
    functionName: "register",
  });

  const handleRegisterWithIdRegistry = async () => {
    if (!switchNetwork || !writeAsync || !recovery || !enable) return;

    try {
      setIsLoading(true);
      await switchNetwork(CONTRACTS.NETWORK);

      await writeAsync({
        args: [
          [address, recovery.address, recovery.deadline, recovery.signature],
          [
            [
              enable.keyType,
              enable.key,
              enable.metadataType,
              enable.metadata,
              enable.deadline,
              enable.signature,
            ],
          ],
          1,
        ],
        value: data,
      });
      setInterval(async () => {
        const res = await fetch(`/api/auth/signer/${enable.signerUuid}`);
        const data = await res.json();
        if (!data?.fid) return;
        await addNewUser(data.fid.toString());
        onSuccess(data.fid);
        setIsLoading(false);
        setDone(true);
        window.location.reload();
      }, 2000);
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row space-x-2 max-w-lg">
      <div>
        <div
          className={`border-2 border-foreground rounded-full w-8 h-8 flex justify-center items-center font-semibold text-lg ${
            done ? "bg-foreground text-background" : "p-2"
          }`}
        >
          {done ? <CheckIcon className="w-8 h-8" /> : 3}
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <div>
          <div className="font-semibold">Create your account</div>
          <div className="text-muted-foreground text-sm">
            Creating an account on Farcaster costs ~$7 (plus gas fees) annually
            to prevent the network from being spammed. This will require an
            on-chain action to register your account with the Farcaster{" "}
            <a
              href="https://optimistic.etherscan.io/address/0x00000000FcAf86937e41bA038B4fA40BAA4B780A"
              target="_blank"
              className="font-bold"
            >
              IdRegistry
            </a>
            .
          </div>
        </div>
        <div className="flex justify-between">
          <div className="text-sm text-red-500">{error}</div>
          <Button
            onClick={handleRegisterWithIdRegistry}
            disabled={!recovery || !enable || isLoading || done}
          >
            {isLoading ? <LoadingIcon /> : "Create account"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const RegisterUsername = ({
  fid,
  onSuccess,
  markDone,
}: {
  fid?: number;
  onSuccess: (username: string) => void;
  markDone: boolean;
}) => {
  const [done, setDone] = useState(markDone);

  useEffect(() => {
    setDone(markDone);
  }, [markDone]);

  return (
    <div className="flex flex-row space-x-2 max-w-lg">
      <div>
        <div
          className={`border-2 border-foreground rounded-full w-8 h-8 flex justify-center items-center font-semibold text-lg ${
            done ? "bg-foreground text-background" : "p-2"
          }`}
        >
          {done ? <CheckIcon className="w-8 h-8" /> : 4}
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <div>
          <div className="font-semibold">Register your username</div>
          <div className="text-muted-foreground text-sm">
            A username is used to identify or mention an account on Farcaster
            and come in two formats: fnames and ENS names. Fnames are issued
            off-chain by the Farcaster Name Registry and are subject to a usage
            policy. ENS names are the fully decentralized alternative to fnames.{" "}
            <b>Currently, flink only supports using fnames.</b>
          </div>
        </div>
        <ChangeUsername
          onSuccess={(u) => {
            setDone(true);
            onSuccess(u);
          }}
        />
      </div>
    </div>
  );
};

const SetupProfile = ({
  fname,
  onSuccess,
  markDone,
}: {
  fname?: string;
  onSuccess: () => void;
  markDone: boolean;
}) => {
  const [done, setDone] = useState(markDone);

  useEffect(() => {
    setDone(markDone);
  }, [markDone]);

  return (
    <div className="flex flex-row space-x-2 max-w-lg">
      <div>
        <div
          className={`border-2 border-foreground rounded-full w-8 h-8 flex justify-center items-center font-semibold text-lg ${
            done ? "bg-foreground text-background" : "p-2"
          }`}
        >
          {done ? <CheckIcon className="w-8 h-8" /> : 5}
        </div>
      </div>
      <div className="flex flex-col space-y-4 w-full">
        <div>
          <div className="font-semibold">Setup your profile</div>
          <div className="text-muted-foreground text-sm"></div>
        </div>
        <Profile onSuccess={onSuccess} useCustody />
      </div>
    </div>
  );
};
