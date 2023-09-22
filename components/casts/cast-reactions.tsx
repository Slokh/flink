"use client";

import { useUser } from "@/context/user";
import { HeartFilledIcon, HeartIcon, UpdateIcon } from "@radix-ui/react-icons";

export const CastReactions = ({
  likes,
  recasts,
  hash,
}: {
  likes: number;
  recasts: number;
  hash: string;
}) => {
  const { user } = useUser();

  const isLiked = user?.likes[hash];
  const isRecasted = user?.recasts[hash];

  return (
    <div className="flex flex-col items-end justify-start text-sm cursor-pointer pr-1 pl-1">
      <div className="flex flex-row items-center group">
        <div className="p-1 group-hover:bg-red-500/30 rounded-full text-zinc-500 group-hover:text-red-500">
          {isLiked ? (
            <HeartFilledIcon className="text-red-500" />
          ) : (
            <HeartIcon />
          )}
        </div>
        <div className="group-hover:text-red-500">{likes}</div>
      </div>
      <div className="flex flex-row items-center group">
        <div className="p-1 group-hover:bg-green-500/30 rounded-full text-zinc-500 group-hover:text-green-500">
          {isRecasted ? (
            <UpdateIcon className="text-green-500" />
          ) : (
            <UpdateIcon />
          )}
        </div>
        <div className="group-hover:text-green-500">{recasts}</div>
      </div>
    </div>
  );
};
