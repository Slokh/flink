import { AuthenticatedUser, DisplayMode, Notification } from "@/lib/types";
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
  users: AuthenticatedUser[];
  user?: AuthenticatedUser;
  custody?: AuthenticatedUser;
  changeUser: (fid: string) => void;
  addNewUser: (fid: number) => void;

  channels: string[];
  addChannel: (url: string) => void;
  removeChannel: (url: string) => void;

  displayMode: DisplayMode;
  changeDisplayMode: (mode: DisplayMode) => void;

  notifications: Notification[];
  hasUnreadNotifications: boolean;

  isLoading: boolean;
  isNotificationsLoading: boolean;
};

type UserContextType = State | undefined;
type UserProviderProps = { children: ReactNode };

const UserContext = createContext<UserContextType>(undefined);

export const UserProvider = ({ children }: UserProviderProps) => {
  const [channels, setChannels] = useState<string[]>([]);
  const [users, setUsers] = useState<AuthenticatedUser[]>([]);
  const [custody, setCustody] = useState<AuthenticatedUser | undefined>();
  const [user, setUser] = useState<AuthenticatedUser | undefined>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const displayMode =
    searchParams.get("display") === "images"
      ? DisplayMode.Images
      : DisplayMode.Default;
  const { authState } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsLoading, setNotificationsLoading] = useState(true);

  const initialize = async (fid?: number) => {
    const res = await fetch(`/api/auth/users`);
    if (!res.ok) return;
    const data: { users: AuthenticatedUser[]; primary: AuthenticatedUser } =
      await res.json();
    setUsers(data.users);
    setCustody(data.primary);

    let user;
    if (fid) {
      localStorage.setItem("fid", fid.toString());
      user = data.users.find((u) => u.fid === fid);
    } else if (localStorage.getItem("fid")) {
      user = data.users.find(
        (u) => u.fid === parseInt(localStorage.getItem("fid") ?? "")
      );
    }

    if (!user) {
      user = data.users[0];
    }
    setUser(user);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    const handle = async () => {
      const notificationsRes = await fetch(
        `/api/auth/${user.fid}/notifications`
      );
      const { notifications, hasUnreadNotifications, notificationsViewedAt } =
        await notificationsRes.json();
      setNotifications(notifications);
      setHasUnreadNotifications(hasUnreadNotifications);
      setNotificationsLoading(false);
    };

    handle();
  }, [user]);

  useEffect(() => {
    if (authState === UserAuthState.LOGGED_IN) {
      setIsLoading(true);
      initialize();
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

  const changeUser = (fid: string) => {
    localStorage.setItem("fid", fid);
    setUser(users.find((u) => u.fid === parseInt(fid)));
  };

  const addNewUser = async (fid: number) => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await initialize(fid);
  };

  return (
    <UserContext.Provider
      value={{
        users,
        user,
        custody,
        channels,
        displayMode,
        addChannel,
        removeChannel,
        changeDisplayMode,
        changeUser,
        addNewUser,
        isLoading,
        notifications,
        hasUnreadNotifications,
        isNotificationsLoading,
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
