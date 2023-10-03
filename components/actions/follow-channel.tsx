"use client";

import { useUser } from "@/context/user";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useParams } from "next/navigation";
import { CHANNELS_BY_ID } from "@/lib/channels";

export const FollowChannel = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const { user, channels, addChannel, removeChannel } = useUser();
  const params = useParams();

  const channelId = params.channel as string;
  const channel =
    CHANNELS_BY_ID[channelId]?.parentUrl || decodeURIComponent(channelId);

  useEffect(() => {
    if (!channels) return;
    setIsFollowing(channels.some((c) => c === channel));
  }, [channel, channels]);

  const handleFollow = async () => {
    if (isFollowing) {
      setIsFollowing(false);
      await fetch(`/api/preferences/${user?.fid}/channels/${channelId}`, {
        method: "DELETE",
      });
      removeChannel(channel);
    } else {
      setIsFollowing(true);
      await fetch(`/api/preferences/${user?.fid}/channels/${channelId}`, {
        method: "POST",
      });
      addChannel(channel);
    }
  };

  if (!user) return <></>;

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
