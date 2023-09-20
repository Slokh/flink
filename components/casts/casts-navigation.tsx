"use client";

import { CastsSort } from "@/lib/types";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "next/navigation";

export const CastsNavigation = ({
  selected,
  community,
  time,
}: {
  selected: CastsSort;
  community?: string;
  time?: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const path = community ? `/channel/${community}` : "";

  const options = [CastsSort.Hot, CastsSort.New, CastsSort.Top];

  return (
    <div className="flex flex-row space-x-2">
      <div>
        {selected === CastsSort.Top && (
          <Select
            defaultValue={time || "day"}
            onValueChange={(value) => router.push(`${pathname}?time=${value}`)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last hour</SelectItem>
              <SelectItem value="day">Last day</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="month">Last month</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      {options.map((sort) => (
        <Link
          key={sort}
          href={`${path}/${sort === CastsSort.Hot ? "/" : sort.toLowerCase()}`}
          className={buttonVariants({
            variant: sort === selected ? "default" : "secondary",
            size: "sm",
          })}
        >
          {sort}
        </Link>
      ))}
    </div>
  );
};

export const UserCastsNavigation = ({
  selected,
  time,
  id,
}: {
  selected: CastsSort;
  time?: string;
  id: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const options = [
    CastsSort.New,
    CastsSort.Top,
    CastsSort.NewReplies,
    CastsSort.TopReplies,
  ];

  return (
    <div className="flex flex-row space-x-1">
      <div>
        {selected === CastsSort.Top && (
          <Select
            defaultValue={time || "day"}
            onValueChange={(value) => router.push(`${pathname}?time=${value}`)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last hour</SelectItem>
              <SelectItem value="day">Last day</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="month">Last month</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      {options.map((sort) => (
        <Link
          key={sort}
          href={`/${id}/${
            sort === CastsSort.New ? "/" : sort.replace(" ", "-").toLowerCase()
          }`}
          className={
            buttonVariants({
              variant: sort === selected ? "default" : "secondary",
              size: "sm",
            }) + " whitespace-nowrap"
          }
        >
          {sort}
        </Link>
      ))}
    </div>
  );
};

export const CastsPagination = ({
  href,
  page,
}: {
  href: string;
  page: number;
}) => {
  return (
    <div className="flex flex-row space-x-2 p-2 border-t justify-end items-end">
      <Link
        href={
          page > 1
            ? `${href}${href.includes("?") ? "&" : "?"}page=${page - 1}`
            : "#"
        }
        className={buttonVariants({
          variant: "outline",
          size: "sm",
        })}
      >
        prev
      </Link>
      <Link
        href={`${href}${href.includes("?") ? "&" : "?"}page=${page + 1}`}
        className={buttonVariants({
          variant: "outline",
          size: "sm",
        })}
      >
        next
      </Link>
    </div>
  );
};
