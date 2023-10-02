"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useUser } from "@/context/user";

export const FollowUser = ({ fid }: { fid: number }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setIsFollowing(user?.follows[fid] ?? false);
  }, [fid, user?.follows]);

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
    const method = isFollowing ? "DELETE" : "POST";
    await fetch("/api/follows", {
      method,
      body: JSON.stringify({
        target_fids: [fid],
      }),
    });
  };

  if (!user || user.fid === fid) return <></>;

  return (
    <div>
      {isFollowing ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleFollow}
          className="hover:lg:border-destructive hover:lg:text-destructive group w-20"
        >
          <span className="hidden group-hover:lg:inline group-hover:lg:text-destructive">
            Unfollow
          </span>
          <span className="group-hover:lg:hidden">Following</span>
        </Button>
      ) : (
        <Button size="sm" onClick={handleFollow} className="w-20">
          Follow
        </Button>
      )}
    </div>
  );
};
