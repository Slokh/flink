"use client";

import { LinkStats } from "@/lib/types";
import { ColumnDef, Row, SortingColumn } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import { Button } from "../ui/button";
import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { usePathname, useRouter } from "next/navigation";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import Link from "next/link";

export const LinksNavigation = ({ time }: { time: string }) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div>
      <Select
        defaultValue={time}
        onValueChange={(value) => router.push(`${pathname}?time=${value}`)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Timeframe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hour">Last hour</SelectItem>
          <SelectItem value="sixHour">Last 6 hours</SelectItem>
          <SelectItem value="twelveHour">Last 12 hours</SelectItem>
          <SelectItem value="day">Last day</SelectItem>
          <SelectItem value="week">Last week</SelectItem>
          {/* <SelectItem value="month">Last month</SelectItem>
          <SelectItem value="year">Last year</SelectItem>
          <SelectItem value="all">All time</SelectItem> */}
        </SelectContent>
      </Select>
    </div>
  );
};

const StatHeader = ({
  column,
  icon,
  children,
  align = "center",
}: {
  column: ColumnDef<LinkStats> & SortingColumn<LinkStats>;
  icon?: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}) => (
  <div className={`flex flex-row items-center justify-${align} text-center`}>
    <Button
      variant="ghost"
      onClick={() => {
        if (column.getIsSorted() === "asc") {
          column.toggleSorting(true);
        } else if (column.getIsSorted() === "desc") {
          column.toggleSorting(false);
        } else {
          column.toggleSorting(true);
        }
      }}
      className="px-1 text-xs"
    >
      <div className="mr-1">{icon}</div>
      {children}
      {column.getIsSorted() === "asc" ? (
        <CaretUpIcon className="ml-1 h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <CaretDownIcon className="ml-1 h-4 w-4" />
      ) : (
        <CaretSortIcon className="ml-1 h-4 w-4" />
      )}
    </Button>
  </div>
);

const StatField = ({ row, field }: { row: Row<LinkStats>; field: string }) => {
  const current = row.getValue(field) as number;

  return (
    <div className="flex flex-row items-center justify-center text-center">
      {current.toFixed(0)}
    </div>
  );
};

export const LinksTable = ({
  time,
  links,
}: {
  time: string;
  links: LinkStats[];
}) => {
  const [sorted, setSorted] = useState<string>();
  const columns: ColumnDef<LinkStats>[] = [
    {
      header: "\u00A0",
      cell: ({ row }) => {
        const field = sorted || "engagement";
        // @ts-ignore
        const delta = row.original.rankDeltas?.[field];
        const showDelta =
          delta !== 0 && (time === "day" || time.endsWith("our"));
        return (
          <div className="flex flex-row items-center space-x-1">
            {delta !== undefined && showDelta && (
              <div className="flex flex-row items-center text-xs text-muted-foreground">
                {delta > 0 ? (
                  <TriangleUpIcon className="text-green-500" />
                ) : (
                  <TriangleDownIcon className="text-red-500" />
                )}
                <div>
                  {delta > 0
                    ? delta
                    : delta < 0
                    ? delta.toString().substring(1)
                    : ""}
                </div>
              </div>
            )}
            {!delta && showDelta && (
              <div className="flex flex-row items-center text-xs text-muted-foreground">
                new
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Link",
      accessorKey: "url",
      cell: ({ row }) => {
        const url = row.getValue("url") as string;
        const metadata = row.original.contentMetadata;
        const title = metadata?.title || url;
        const image = metadata?.open_graph?.images?.[0]?.url;
        return (
          <div className="flex flex-row items-center space-x-2">
            <div className="w-8 h-8">
              {image && (
                <img src={image} alt={image} className="object-cover w-8 h-8" />
              )}
            </div>
            <div className="flex flex-col w-48 md:w-96">
              <Link
                href={`/links/${url}`}
                className="text-semibold line-clamp-2 hover:dark:text-purple-400 hover:text-purple-600 transition"
              >
                {title}
              </Link>
              <a
                href={`https://${url}`}
                target="_blank"
                className="truncate text-muted-foreground text-xs hover:underline transition"
              >
                {url}
              </a>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "engagement",
      header: ({ column }) => (
        <StatHeader column={column} icon="🔥">
          Activity
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="engagement" />,
    },
    {
      accessorKey: "posts",
      header: ({ column }) => <StatHeader column={column}>Posts</StatHeader>,
      cell: ({ row }) => <StatField row={row} field="posts" />,
    },
    {
      accessorKey: "replies",
      header: ({ column }) => <StatHeader column={column}>Replies</StatHeader>,
      cell: ({ row }) => <StatField row={row} field="replies" />,
    },
    {
      accessorKey: "likes",
      header: ({ column }) => <StatHeader column={column}>Likes</StatHeader>,
      cell: ({ row }) => <StatField row={row} field="likes" />,
    },
    {
      accessorKey: "recasts",
      header: ({ column }) => <StatHeader column={column}>Recasts</StatHeader>,
      cell: ({ row }) => <StatField row={row} field="recasts" />,
    },
  ];

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-row items-center justify-end p-2 border-b">
        <LinksNavigation time={time} />
      </div>
      <ScrollArea>
        <ScrollBar orientation="horizontal" />
        <DataTable
          columns={columns}
          data={links}
          onSortingChange={(state) => setSorted(state?.[0]?.id)}
          defaultSorting={[{ id: "engagement", desc: true }]}
        />
      </ScrollArea>
    </div>
  );
};
