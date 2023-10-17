import { FarcasterUser } from "@/lib/types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { FollowUser } from "./actions/follow-user";

export const WithUserTooltip = ({
  user,
  children,
}: {
  user?: FarcasterUser;
  children: React.ReactNode;
}) => {
  if (!user) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="text-start">{children}</TooltipTrigger>
        <TooltipContent className="bg-background flex flex-col space-y-2 border text-foreground text-md w-80 p-2">
          <div className="flex flex-row justify-between">
            <Link
              href={`/${user.fname}`}
              className="flex flex-row space-x-2 items-center"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.pfp} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-medium line-clamp-1">
                  {user.display || user.fname}
                </div>
                <div>{`@${user.fname}`}</div>
              </div>
            </Link>
            <FollowUser fid={user.fid} />
          </div>
          <div>{user.bio}</div>
          {user.followers && user.following && (
            <div className="flex flex-col">
              <div className="flex flex-row space-x-2">
                <div className="flex flex-row space-x-1 items-center">
                  <span className="font-semibold">
                    {user.following > 9999
                      ? `${Math.floor(user.following / 1000)}k`
                      : user.following.toLocaleString("en-US")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    following
                  </span>
                </div>
                <div className="flex flex-row space-x-1 items-center">
                  <span className="font-semibold">
                    {user.followers > 9999
                      ? `${Math.floor(user.followers / 1000)}k`
                      : user.followers.toLocaleString("en-US")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    followers
                  </span>
                </div>
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const User = ({
  user,
  showDisplay,
  showAvatar,
  showUsername,
  avatarSize,
  isHighlighted,
}: {
  user?: FarcasterUser;
  showDisplay?: boolean;
  showAvatar?: boolean;
  showUsername?: boolean;
  avatarSize?: number;
  isHighlighted?: boolean;
}) => {
  const avatarClass = avatarSize
    ? `h-${avatarSize} w-${avatarSize}`
    : "h-4 w-4";
  if (!user?.fname) {
    return (
      <div className="flex flex-row items-center space-x-1">
        <Avatar className={avatarClass}>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="text-muted-foreground">
          {user?.fid ? `fid:${user.fid}` : "unknown"}
        </div>
      </div>
    );
  }

  return (
    <WithUserTooltip user={user}>
      <Link
        href={`/${user?.fname}`}
        className={`flex flex-row items-center space-x-1 group overflow-hidden ${
          isHighlighted
            ? "border border-purple-600 dark:border-purple-400 pl-1 rounded-lg"
            : ""
        }`}
      >
        {showAvatar && (
          <Avatar className={avatarClass}>
            <AvatarImage src={user.pfp} className="object-cover" />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        )}
        {showDisplay && user.display && (
          <div className="font-medium">{user.display || user.fname}</div>
        )}
        {showUsername && (
          <div
            className={`font-medium text-purple-600 dark:text-purple-400 hover:underline ${
              isHighlighted ? "pr-[2px]" : ""
            }`}
          >
            {user.fname}
          </div>
        )}
        {isHighlighted && (
          <div className="px-[2px] font-bold bg-purple-600 dark:bg-purple-400 text-background">
            <span className="text-xs">OP</span>
          </div>
        )}
      </Link>
    </WithUserTooltip>
  );
};
