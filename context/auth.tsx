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
  address?: `0x${string}`;
  authState: UserAuthState;
  verifyMessage: () => void;
  signerApprovalUrl?: string;
  isVerifying?: boolean;

  watchForLatestSigner: () => Promise<void>;
};

type AuthContextType = State | undefined;
type AuthProviderProps = { children: ReactNode };

const AuthContext = createContext<AuthContextType>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<UserAuthState>(
    UserAuthState.UNKNOWN
  );
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { signMessageAsync } = useSignMessage();
  const [signerState, setSignerState] = useState<SignerState | undefined>();
  const [verifiedAddress, setVerifiedAddress] = useState<string | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyMessage = async () => {
    setIsVerifying(true);
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
    setIsVerifying(false);
  };

  const getVerifiedAddress = async () => {
    const res = await fetch("/api/auth/user");
    if (!res.ok) return;
    const { address } = await res.json();
    return address;
  };

  const fetchSigner = async (): Promise<SignerState> => {
    const res = await fetch(`/api/signer`);
    return await res.json();
  };

  const watchForLatestSigner = async () => {
    const signer = await fetchSigner();
    if (!signer?.fid) return;
    setSignerState(signer);
    setAuthState(UserAuthState.LOGGED_IN);
  };

  useEffect(() => {
    const handler = async () => {
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

      let signer = await fetchSigner();
      setSignerState(signer);
      if (!signer.signerApprovalUrl && !signer.fid) {
        setAuthState(UserAuthState.VERIFIED);
        return;
      }

      if (!signer.fid) {
        setAuthState(UserAuthState.NEEDS_APPROVAL);
        return;
      }

      setAuthState(UserAuthState.LOGGED_IN);
    };
    handler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, verifiedAddress, isConnected]);

  const value = {
    address,
    authState,
    verifyMessage,
    signerApprovalUrl: signerState?.signerApprovalUrl,
    watchForLatestSigner,
    isVerifying,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }

  return context;
};
