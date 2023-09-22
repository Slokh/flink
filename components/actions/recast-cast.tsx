"use client";

import { useUser } from "@/context/user";
import { UpdateIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

export const RecastCast = ({
  recasts,
  hash,
  mode,
}: {
  hash: string;
  recasts: number;
  mode: "icons" | "text";
}) => {
  const [isRecastd, setIsRecastd] = useState(false);
  const [totalRecasts, setTotalRecasts] = useState(recasts);
  const { signerState, user } = useUser();

  useEffect(() => {
    setIsRecastd(user?.recasts[hash] ?? false);
  }, [hash, user?.recasts]);

  const recastCast = async () => {
    const method = isRecastd ? "DELETE" : "POST";
    await fetch("/api/reactions", {
      method,
      body: JSON.stringify({
        signer_uuid: signerState?.signerUuid,
        target: hash,
        reaction_type: "recast",
      }),
    });
    setTotalRecasts(isRecastd ? totalRecasts - 1 : totalRecasts + 1);
    setIsRecastd(!isRecastd);
  };

  return (
    <div className="flex flex-row items-center group" onClick={recastCast}>
      {mode === "icons" ? (
        <>
          <div className="p-1 group-hover:bg-green-500/30 rounded-full text-zinc-500 group-hover:text-green-500">
            {isRecastd ? (
              <UpdateIcon className="text-green-500" />
            ) : (
              <UpdateIcon />
            )}
          </div>
          <div className="group-hover:text-green-500">{totalRecasts}</div>
        </>
      ) : isRecastd ? (
        <div className="text-green-500">{`${totalRecasts} recasts`}</div>
      ) : (
        <div>{`${totalRecasts} recasts`}</div>
      )}
    </div>
  );
};
