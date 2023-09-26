import { AuthenticatedUser } from "@/lib/types";
import { formatSiweMessage } from "@/lib/utils";
import {
  useEffect,
  useState,
  createContext,
  ReactNode,
  useContext,
} from "react";
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

export type SignerState = {
  signerUuid: string;
  signerStatus: string;
  signerPublicKey: string;
  signerApprovalUrl?: string;
  fid?: number;
};

type State = {
  user?: AuthenticatedUser;
  address?: `0x${string}`;
  authState: UserAuthState;
  verifyMessage: () => void;
  signerApprovalUrl?: string;
  signerUuid?: string;

  watchForLatestSigner: () => Promise<void>;
};

type UserContextType = State | undefined;
type UserProviderProps = { children: ReactNode };

const UserContext = createContext<UserContextType>(undefined);

export const UserProvider = ({ children }: UserProviderProps) => {
  const [authState, setAuthState] = useState<UserAuthState>(
    UserAuthState.UNKNOWN
  );
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { signMessageAsync } = useSignMessage();
  const [signerState, setSignerState] = useState<SignerState | undefined>();
  const [user, setUser] = useState<AuthenticatedUser | undefined>();

  const verifyMessage = async () => {
    try {
      const chainId = chain?.id;
      if (!address || !chainId) return;

      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();

      const message = {
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: nonce,
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

      setSignerState(await initializeNewSigner(address));
      setAuthState(UserAuthState.VERIFIED);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSignerForAddress = async (
    address: string
  ): Promise<SignerState | undefined> => {
    const res = await fetch(`/api/signer/${address}`);
    if (!res.ok) return;
    return await res.json();
  };

  const initializeNewSigner = async (
    address: string
  ): Promise<SignerState | undefined> => {
    const res = await fetch("/api/signer", {
      method: "POST",
    });
    const json = await res.json();
    const res2 = await fetch(`/api/signer/key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        signerUuid: json.signerUuid,
        signerPublicKey: json.signerPublicKey,
      }),
    });
    return await res2.json();
  };

  const fetchLatestSigner = async (
    address: string,
    signerUuid: string
  ): Promise<SignerState | undefined> => {
    const res = await fetch(`/api/signer/${address}/${signerUuid}`);
    if (!res.ok) return;
    return await res.json();
  };

  const fetchUserForFid = async (
    fid: number
  ): Promise<AuthenticatedUser | undefined> => {
    const res = await fetch(`/api/fid/${fid}`);
    if (!res.ok) return;
    return await res.json();
  };

  const watchForLatestSigner = async () => {
    if (!address || !signerState?.signerUuid) return;
    const signer = await fetchLatestSigner(address, signerState?.signerUuid);
    if (!signer?.fid) return;
    setSignerState(signer);
    const user = await fetchUserForFid(signer.fid);
    if (!user) return;
    setUser(user);
  };

  useEffect(() => {
    const handler = async () => {
      if (!address) {
        setAuthState(UserAuthState.DISCONNECTED);
        return;
      }

      let authState = UserAuthState.CONNECTED;

      let signer = await fetchSignerForAddress(address);
      if (!signer) {
        setAuthState(authState);
        return;
      }
      authState = UserAuthState.VERIFIED;

      if (!signer.fid) {
        const latestSigner = await fetchLatestSigner(
          address,
          signer.signerUuid
        );
        if (latestSigner) signer = latestSigner;
      }

      if (signer.fid) {
        const user = await fetchUserForFid(signer.fid);
        setUser(user);
        authState = UserAuthState.LOGGED_IN;
      }

      setAuthState(authState);
      setSignerState(signer);
    };
    handler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  const value = {
    user,
    address,
    authState,
    verifyMessage,
    signerApprovalUrl: signerState?.signerApprovalUrl,
    signerUuid: signerState?.signerUuid,
    watchForLatestSigner,
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
