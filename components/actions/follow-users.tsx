"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useUser } from "@/context/user";

export const FollowUsers = ({ fids }: { fids: number[] }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setIsFollowing(fids.every((fid) => user?.follows[fid] ?? false));
  }, [fids, user?.follows]);

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
    const method = isFollowing ? "DELETE" : "POST";
    await fetch(`/api/auth/${user?.fid}/follows`, {
      method,
      body: JSON.stringify({
        target_fids: fids,
      }),
    });
  };

  if (!user) return <></>;

  return (
    <div>
      {isFollowing ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleFollow}
          className="hover:lg:border-destructive hover:lg:text-destructive group w-24 whitespace-nowrap"
        >
          <span className="hidden group-hover:lg:inline group-hover:lg:text-destructive">
            Unfollow All
          </span>
          <span className="group-hover:lg:hidden">Following All</span>
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={handleFollow}
          className="w-24 whitespace-nowrap"
        >
          Follow All
        </Button>
      )}
    </div>
  );
};
