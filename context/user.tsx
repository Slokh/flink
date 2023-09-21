import { FarcasterUser } from "@/lib/types";
import { formatSiweMessage } from "@/lib/utils";
import { useEffect } from "react";
import { useState } from "react";
import { createContext, ReactNode, useContext } from "react";
import { SiweMessage } from "siwe";
import { useAccount, useNetwork, useSignMessage } from "wagmi";

export enum UserAuthState {
  UNKNOWN,
  DISCONNECTED,
  CONNECTED,
  VERIFIED,
  NEEDS_APPROVAL,
  LOGGED_IN,
}

type VerifyState = {
  loading?: boolean;
  nonce?: string;
  address?: `0x${string}` | undefined;
};

export type SignerState = {
  signerUuid: string;
  signerStatus: string;
  signerPublicKey: string;
  signerApprovalUrl?: string;
  fid?: number;
};

type State = {
  user?: FarcasterUser;
  address?: `0x${string}`;
  authState: UserAuthState;
  verifyMessage: () => void;
  verifyState?: VerifyState;
  signerState?: SignerState;

  fetchSignerData: () => Promise<void>;
};

type UserContextType = State | undefined;
type UserProviderProps = { children: ReactNode };

const UserContext = createContext<UserContextType>(undefined);

export const UserProvider = ({ children }: UserProviderProps) => {
  const [authState, setAuthState] = useState<UserAuthState>(
    UserAuthState.UNKNOWN
  );
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const { signMessageAsync } = useSignMessage();
  const [verifyState, setVerifyState] = useState<VerifyState>({});
  const [signerState, setSignerState] = useState<SignerState | undefined>();
  const [user, setUser] = useState<FarcasterUser | undefined>();

  const fetchNonce = async () => {
    try {
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();
      setVerifyState((x) => ({ ...x, nonce }));
    } catch (error) {
      setVerifyState((x) => ({ ...x, error: error as Error }));
    }
  };

  const updateSignerState = async () => {
    const signerData = await (
      await fetch("/api/signer", {
        method: "POST",
      })
    ).json();
    const res = await fetch(`/api/signer/key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        signerUuid: signerData.signerUuid,
        signerPublicKey: signerData.signerPublicKey,
      }),
    });
    setSignerState(await res.json());
  };

  const verifyMessage = async () => {
    try {
      const chainId = chain?.id;
      if (!address || !chainId) return;

      setVerifyState((x) => ({ ...x, loading: true }));
      // Create SIWE message with pre-fetched nonce and sign with wallet
      const message = {
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: verifyState.nonce,
      } as SiweMessage;
      const signature = await signMessageAsync({
        message: formatSiweMessage(message),
      });

      // Verify signature
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, signature }),
      });
      if (!verifyRes.ok) throw new Error("Error verifying message");

      setVerifyState((x) => ({ ...x, loading: false, address }));

      if (!signerState?.signerApprovalUrl) {
        await updateSignerState();
      }
    } catch (error) {
      setVerifyState((x) => ({ ...x, loading: false, nonce: undefined }));
      fetchNonce();
    }
  };

  useEffect(() => {
    fetchNonce();
  }, []);

  useEffect(() => {
    const handler = async () => {
      const signerRes = await fetch(`/api/signer/${address}`);
      if (signerRes.ok) {
        setSignerState(await signerRes.json());
      } else {
        try {
          const res = await fetch("/api/auth/user");
          const json = await res.json();
          setVerifyState((x) => ({ ...x, address: json.address }));
          if (json.address === address) {
            await updateSignerState();
          }
        } catch (_error) {}
      }
    };
    if (address) {
      handler();
      window.addEventListener("focus", handler);
      return () => window.removeEventListener("focus", handler);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const fetchSignerData = async () => {
    if (!address || !signerState?.signerUuid) return;
    const res = await fetch(
      `/api/signer/${address}/${signerState?.signerUuid}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setSignerState(data);
    setUser(await (await fetch(`/api/fid/${data.fid}`)).json());
  };

  useEffect(() => {
    if (!isConnected) {
      setAuthState(UserAuthState.DISCONNECTED);
    } else if (signerState?.fid) {
      setAuthState(UserAuthState.LOGGED_IN);
      return;
    } else if (signerState?.signerApprovalUrl) {
      setAuthState(UserAuthState.NEEDS_APPROVAL);
      return;
    } else if (verifyState?.address && verifyState.address === address) {
      setAuthState(UserAuthState.VERIFIED);
      return;
    } else {
      setAuthState(UserAuthState.CONNECTED);
    }
  }, [address, isConnected, signerState, verifyState]);

  const value = {
    user,
    address,
    authState,
    verifyMessage,
    verifyState,
    signerState,
    fetchSignerData,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};
