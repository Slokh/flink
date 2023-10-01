import { AuthenticatedUser, DisplayMode } from "@/lib/types";
import {
  useEffect,
  useState,
  createContext,
  ReactNode,
  useContext,
} from "react";
import { UserAuthState, useAuth } from "./auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type State = {
  user?: AuthenticatedUser;

  channels: string[];
  addChannel: (url: string) => void;
  removeChannel: (url: string) => void;

  displayMode: DisplayMode;
  changeDisplayMode: (mode: DisplayMode) => void;
};

type UserContextType = State | undefined;
type UserProviderProps = { children: ReactNode };

const UserContext = createContext<UserContextType>(undefined);

export const UserProvider = ({ children }: UserProviderProps) => {
  const [channels, setChannels] = useState<string[]>([]);
  const [user, setUser] = useState<AuthenticatedUser | undefined>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const displayMode =
    searchParams.get("display") === "images"
      ? DisplayMode.Images
      : DisplayMode.Default;
  const { authState } = useAuth();

  useEffect(() => {
    const handle = async () => {
      const res = await fetch(`/api/preferences`);
      if (!res.ok) return;
      setUser(await res.json());
    };

    if (authState === UserAuthState.LOGGED_IN) {
      handle();
    }
  }, [authState]);

  useEffect(() => {
    setChannels(user?.preferences.channels ?? []);
  }, [user]);

  const addChannel = (url: string) => {
    setChannels([...channels, url]);
  };

  const removeChannel = (url: string) => {
    setChannels(channels.filter((c) => c !== url));
  };

  const changeDisplayMode = (mode: DisplayMode) => {
    const params = new URLSearchParams(searchParams);
    params.delete("display");
    if (mode !== DisplayMode.Default) {
      params.set("display", mode);
    }
    const newQuery = params.toString();
    router.push(`${pathname}${newQuery ? `?${newQuery}` : ""}`);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        channels,
        displayMode,
        addChannel,
        removeChannel,
        changeDisplayMode,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};
