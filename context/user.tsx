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
  const [verifiedAddress, setVerifiedAddress] = useState<string | undefined>();

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
      setVerifiedAddress(address);
    } catch (error) {
      console.error(error);
    }
  };

  const getVerifiedAddress = async () => {
    const res = await fetch("/api/auth/user");
    if (!res.ok) return;
    const { address } = await res.json();
    return address;
  };

  const fetchSigner = async (address: string): Promise<SignerState> => {
    const res = await fetch(`/api/signer/${address}`);
    return await res.json();
  };

  const fetchUserForFid = async (
    fid: number
  ): Promise<AuthenticatedUser | undefined> => {
    const res = await fetch(
      `/api/fid/${localStorage.getItem("flink-fid") || fid}`
    );
    if (!res.ok) return;
    return await res.json();
  };

  const watchForLatestSigner = async () => {
    if (!address || !signerState?.signerUuid) return;
    const signer = await fetchSigner(address);
    if (!signer?.fid) return;
    setSignerState(signer);
    const user = await fetchUserForFid(signer.fid);
    if (!user) return;
    setUser(user);
    setAuthState(UserAuthState.LOGGED_IN);
  };

  useEffect(() => {
    const handler = async () => {
      setUser(undefined);
      if (!address) {
        setAuthState(UserAuthState.DISCONNECTED);
        return;
      }

      const verifiedAddress = await getVerifiedAddress();
      if (!verifiedAddress || verifiedAddress !== address) {
        setSignerState(undefined);
        setAuthState(UserAuthState.CONNECTED);
        return;
      }

      let signer = await fetchSigner(address);
      setSignerState(signer);
      if (!signer.signerApprovalUrl && !signer.fid) {
        setAuthState(UserAuthState.VERIFIED);
        return;
      }

      if (!signer.fid) {
        setAuthState(UserAuthState.NEEDS_APPROVAL);
        return;
      }

      setUser(await fetchUserForFid(signer.fid));
      setAuthState(UserAuthState.LOGGED_IN);
    };
    handler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, verifiedAddress, isConnected]);

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
