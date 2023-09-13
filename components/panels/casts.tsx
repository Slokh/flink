/* eslint-disable @next/next/no-img-element */
"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { Embed, FarcasterCast, FarcasterMention } from "@/lib/types";
import { Loading } from "../loading";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { EmbedPreview } from "../embeds";
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  format,
} from "date-fns";

const formatDistanceCustom = (date1: Date, date2: Date) => {
  const diffInSeconds = differenceInSeconds(date2, date1);
  const diffInMinutes = differenceInMinutes(date2, date1);
  const diffInHours = differenceInHours(date2, date1);
  const diffInDays = differenceInDays(date2, date1);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    return format(date1, "MMM do");
  }
};

const formatText = (
  text: string,
  mentions: FarcasterMention[],
  embeds: Embed[]
) => {
  let formattedText = text;
  embeds.forEach((embed) => {
    formattedText = formattedText.replace(embed.url, "");
  });

  // Sort mentions by position in descending order to avoid messing up the indices
  const sortedMentions = [...mentions].sort((a, b) => b.position - a.position);

  // Insert mentions into the text
  sortedMentions.forEach((mention) => {
    const el = `<a href="/${mention.mention.fname}" class="current relative hover:underline text-purple-600 dark:text-purple-400">@${mention.mention.fname}</a>`;
    formattedText = `${formattedText.slice(
      0,
      mention.position
    )}${el}${formattedText.slice(mention.position)}`;
  });

  // Replace URLs with anchor tags
  formattedText = formattedText.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a class="current relative hover:underline text-purple-600 dark:text-purple-400" href="$1">$1</a>'
  );

  return formattedText;
};

const CastStatusItem = ({
  children,
  amount,
}: {
  children: React.ReactNode;
  amount: number | string;
}) => (
  <div className="flex flex-row space-x-1 text-zinc-500 items-center text-sm">
    <div>{children}</div>
    <div>{amount}</div>
  </div>
);

const CastStatus = ({ cast }: { cast: FarcasterCast }) => (
  <div className="flex flex-row space-x-12 p-1">
    <CastStatusItem amount={"?"}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.5 3L2.5 3.00002C1.67157 3.00002 1 3.6716 1 4.50002V9.50003C1 10.3285 1.67157 11 2.5 11H7.50003C7.63264 11 7.75982 11.0527 7.85358 11.1465L10 13.2929V11.5C10 11.2239 10.2239 11 10.5 11H12.5C13.3284 11 14 10.3285 14 9.50003V4.5C14 3.67157 13.3284 3 12.5 3ZM2.49999 2.00002L12.5 2C13.8807 2 15 3.11929 15 4.5V9.50003C15 10.8807 13.8807 12 12.5 12H11V14.5C11 14.7022 10.8782 14.8845 10.6913 14.9619C10.5045 15.0393 10.2894 14.9965 10.1464 14.8536L7.29292 12H2.5C1.11929 12 0 10.8807 0 9.50003V4.50002C0 3.11931 1.11928 2.00003 2.49999 2.00002Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        ></path>
      </svg>
    </CastStatusItem>
    <CastStatusItem amount={cast.recasts}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.64538 3.15554 4.3262C2.44102 5.13021 1.90321 6.10154 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3546 11.7585 10.6738C12.4731 9.86976 13.0109 8.89844 13.0109 7.70321Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        ></path>
      </svg>
    </CastStatusItem>
    <CastStatusItem amount={cast.likes}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.89346 2.35248C3.49195 2.35248 2.35248 3.49359 2.35248 4.90532C2.35248 6.38164 3.20954 7.9168 4.37255 9.33522C5.39396 10.581 6.59464 11.6702 7.50002 12.4778C8.4054 11.6702 9.60608 10.581 10.6275 9.33522C11.7905 7.9168 12.6476 6.38164 12.6476 4.90532C12.6476 3.49359 11.5081 2.35248 10.1066 2.35248C9.27059 2.35248 8.81894 2.64323 8.5397 2.95843C8.27877 3.25295 8.14623 3.58566 8.02501 3.88993C8.00391 3.9429 7.98315 3.99501 7.96211 4.04591C7.88482 4.23294 7.7024 4.35494 7.50002 4.35494C7.29765 4.35494 7.11523 4.23295 7.03793 4.04592C7.01689 3.99501 6.99612 3.94289 6.97502 3.8899C6.8538 3.58564 6.72126 3.25294 6.46034 2.95843C6.18109 2.64323 5.72945 2.35248 4.89346 2.35248ZM1.35248 4.90532C1.35248 2.94498 2.936 1.35248 4.89346 1.35248C6.0084 1.35248 6.73504 1.76049 7.20884 2.2953C7.32062 2.42147 7.41686 2.55382 7.50002 2.68545C7.58318 2.55382 7.67941 2.42147 7.79119 2.2953C8.265 1.76049 8.99164 1.35248 10.1066 1.35248C12.064 1.35248 13.6476 2.94498 13.6476 4.90532C13.6476 6.74041 12.6013 8.50508 11.4008 9.96927C10.2636 11.3562 8.92194 12.5508 8.00601 13.3664C7.94645 13.4194 7.88869 13.4709 7.83291 13.5206C7.64324 13.6899 7.3568 13.6899 7.16713 13.5206C7.11135 13.4709 7.05359 13.4194 6.99403 13.3664C6.0781 12.5508 4.73641 11.3562 3.59926 9.96927C2.39872 8.50508 1.35248 6.74041 1.35248 4.90532Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        ></path>
      </svg>
    </CastStatusItem>
  </div>
);

const Cast = forwardRef<HTMLDivElement, { cast: FarcasterCast }>(
  ({ cast }, ref) => {
    const username = cast.user.fname || `fid: ${cast.user.fid}`;
    const displayName = cast.user.display || username;

    return (
      <div
        ref={ref}
        className="w-full flex flex-col space-y-2 border-b p-4 pt-2 pb-2"
      >
        <div className="flex flex-row space-x-2 w-full">
          <a href={`/${cast.user.fname}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={cast.user.pfp} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          </a>
          <div className="flex flex-col space-y-1 w-full">
            <div className="flex flex-row justify-between">
              <a
                href={`/${cast.user.fname}`}
                className="flex flex-row space-x-1 items-center"
              >
                <div className="font-semibold text-sm">{displayName}</div>
                <div className="font-normal text-sm text-zinc-500">{`@${username}`}</div>
              </a>
              <div className="font-normal text-sm text-zinc-500">
                {formatDistanceCustom(new Date(cast.timestamp), new Date())}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex flex-col whitespace-pre-wrap break-words pb-2 text-base leading-5 tracking-normal">
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatText(cast.text, cast.mentions, cast.embeds),
                  }}
                />
              </div>
              {cast.embeds.map((embed, i) => (
                <EmbedPreview key={i} embed={embed} />
              ))}
              <CastStatus cast={cast} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
Cast.displayName = "Cast";

export const Casts = ({ fid }: { fid?: number }) => {
  const [casts, setCasts] = useState<FarcasterCast[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastCastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPageNumber) => prevPageNumber + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading]
  );

  useEffect(() => {
    fetch(`/api/casts?page=${page}&${fid ? `fid=${fid}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        setCasts((prev) => [...prev, ...data]);
        setLoading(false);
      });
  }, [fid, page]);

  if (loading) {
    return (
      <div
        className="flex justify-center items-center"
        style={{ height: "calc(100vh - 40px)" }}
      >
        <Loading width={32} />
      </div>
    );
  }

  if (!casts.length) {
    return (
      <div
        className="flex justify-center items-center"
        style={{ height: "calc(100vh - 40px)" }}
      >
        No casts yet
      </div>
    );
  }

  return (
    <div className="w-full">
      {casts.map((cast, index) => {
        if (casts.length >= index + 5) {
          return <Cast ref={lastCastElementRef} key={cast.hash} cast={cast} />;
        } else {
          return <Cast key={cast.hash} cast={cast} />;
        }
      })}
    </div>
  );
};
