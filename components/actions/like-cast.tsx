"use client";

import { useUser } from "@/context/user";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

export const LikeCast = ({
  likes,
  hash,
  mode,
}: {
  hash: string;
  likes: number;
  mode: "icons" | "text";
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(likes);
  const { user } = useUser();

  useEffect(() => {
    setIsLiked(user?.likes[hash] ?? false);
  }, [hash, user?.likes]);

  const likeCast = async () => {
    if (!user) return;
    setIsLiked(!isLiked);
    setTotalLikes(isLiked ? totalLikes - 1 : totalLikes + 1);
    const method = isLiked ? "DELETE" : "POST";
    await fetch("/api/reactions", {
      method,
      body: JSON.stringify({
        target: hash,
        reaction_type: "like",
      }),
    });
  };

  return (
    <div className="flex flex-row items-center group" onClick={likeCast}>
      {mode === "icons" ? (
        <>
          <div
            className={`p-1 rounded-full text-zinc-500 ${
              user
                ? "cursor-pointer group-hover:bg-red-500/30 group-hover:text-red-500"
                : ""
            }`}
          >
            {isLiked ? (
              <HeartFilledIcon className="text-red-500" />
            ) : (
              <HeartIcon />
            )}
          </div>
          <div
            className={user ? "cursor-pointer group-hover:text-red-500" : ""}
          >
            {totalLikes}
          </div>
        </>
      ) : isLiked ? (
        <div className="text-red-500">{`${totalLikes} likes`}</div>
      ) : (
        <div>{`${totalLikes} likes`}</div>
      )}
    </div>
  );
};
