"use client";

import Loading from "@/app/loading";
import { useIsVisible } from "@/hooks/useIsVisible";
import { CastsSort, FarcasterCast } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { Cast } from "./cast";

export const MoreCasts = ({
  sort,
  parentUrl,
  time,
  page,
  fid,
}: {
  page: number;
  time?: string;
  parentUrl?: string;
  fid?: number;
  sort: CastsSort;
}) => {
  const [casts, setCasts] = useState<FarcasterCast[]>([]);
  const [done, setDone] = useState(false);
  const container = useRef(null);
  const visible = useIsVisible(container);

  useEffect(() => {
    const handle = async () => {
      const currentPage = Math.floor(casts.length / 25) + page;
      const data = await fetch(
        `/api/casts?sort=${sort}${parentUrl ? `&parentUrl=${parentUrl}` : ""}${
          time ? `&time=${time}` : ""
        }${fid ? `&fid=${fid}` : ""}${
          currentPage ? `&page=${currentPage}` : ""
        }`
      );
      const newCasts = await data.json();
      if (newCasts.length !== 25) {
        setDone(true);
      }
      setCasts((casts) => [...casts, ...newCasts]);
    };
    if (visible) {
      handle();
    }
  }, [visible]);

  return (
    <>
      {casts.map((cast, i) => (
        <Cast
          key={cast.hash}
          cast={cast}
          rank={sort !== CastsSort.New ? (page - 1) * 25 + i + 1 : undefined}
          isReply={
            sort === CastsSort.NewReplies || sort === CastsSort.TopReplies
          }
          isLink
        />
      ))}
      {!done && (
        <div className="p-4" ref={container}>
          <Loading />
        </div>
      )}
    </>
  );
};
