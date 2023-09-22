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
  const { signerState, user } = useUser();

  useEffect(() => {
    setIsLiked(user?.likes[hash] ?? false);
  }, [hash, user?.likes]);

  const likeCast = async () => {
    const method = isLiked ? "DELETE" : "POST";
    await fetch("/api/reactions", {
      method,
      body: JSON.stringify({
        signer_uuid: signerState?.signerUuid,
        target: hash,
        reaction_type: "like",
      }),
    });
    setTotalLikes(isLiked ? totalLikes - 1 : totalLikes + 1);
    setIsLiked(!isLiked);
  };

  return (
    <div className="flex flex-row items-center group" onClick={likeCast}>
      {mode === "icons" ? (
        <>
          <div className="p-1 group-hover:bg-red-500/30 rounded-full text-zinc-500 group-hover:text-red-500">
            {isLiked ? (
              <HeartFilledIcon className="text-red-500" />
            ) : (
              <HeartIcon />
            )}
          </div>
          <div className="group-hover:text-red-500">{totalLikes}</div>
        </>
      ) : isLiked ? (
        <div className="text-red-500">{`${totalLikes} likes`}</div>
      ) : (
        <div>{`${totalLikes} likes`}</div>
      )}
    </div>
  );
};
