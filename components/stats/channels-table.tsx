"use client";

import { Channel, ChannelStats } from "@/lib/types";
import { ColumnDef, Row, SortingColumn } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export const ChannelsNavigation = ({ time }: { time: string }) => {
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
          <SelectItem value="month">Last month</SelectItem>
          <SelectItem value="year">Last year</SelectItem>
          <SelectItem value="all">All time</SelectItem>
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
  column: ColumnDef<ChannelStats> & SortingColumn<ChannelStats>;
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

const StatField = ({
  row,
  field,
}: {
  row: Row<ChannelStats>;
  field: string;
}) => {
  const current = row.getValue(field) as number;

  return (
    <div className="flex flex-row items-center justify-center text-center">
      {current.toFixed(0)}
    </div>
  );
};

export const ChannelsTable = ({
  time,
  channels,
}: {
  time: string;
  channels: ChannelStats[];
}) => {
  const [sorted, setSorted] = useState<string>();
  const columns: ColumnDef<ChannelStats>[] = [
    {
      header: "\u00A0",
      cell: ({ row }) => {
        const field = sorted || "engagement";
        // @ts-ignore
        const delta = row.original.rankDeltas[field];
        return (
          <div className="flex flex-row items-center space-x-1">
            {delta !== 0 && time !== "year" && time !== "all" && (
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
          </div>
        );
      },
    },
    {
      header: ({ column }) => (
        <StatHeader column={column} align="start">
          Channel
        </StatHeader>
      ),
      accessorKey: "channel.name",
      sortingFn: (a, b) => {
        const isUnknownA =
          a.original.channel.name === a.original.channel.parentUrl &&
          a.original.channel.channelId === a.original.channel.parentUrl;
        const isUnknownB =
          b.original.channel.name === b.original.channel.parentUrl &&
          b.original.channel.channelId === b.original.channel.parentUrl;
        if (isUnknownA && isUnknownB) {
          return 0;
        } else if (isUnknownA) {
          return 1;
        } else if (isUnknownB) {
          return -1;
        }
        return a.original.channel.name.localeCompare(b.original.channel.name);
      },
      cell: ({ row }) => {
        const channel = row.original.channel as Channel;
        const isUnknown =
          channel.name === channel.parentUrl &&
          channel.channelId === channel.parentUrl;
        return isUnknown ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <a
                  href={`/f/${encodeURIComponent(channel.channelId)}`}
                  className="flex flex-row space-x-2 items-center transition cursor-pointer p-1 w-64"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={channel.image} className="object-cover" />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div className="text-muted-foreground truncate">
                    {channel.parentUrl}
                  </div>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  This is a new channel and has not been registered on flink
                  yet.
                </div>
                <div>
                  <b>Channel URL: </b>
                  {channel.parentUrl}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <a
            href={`/f/${channel.channelId}`}
            className="flex flex-row space-x-2 items-center hover:text-purple-600 hover:dark:text-purple-400 transition p-1"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={channel.image} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="font-semibold">{channel.name}</div>
          </a>
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
        <ChannelsNavigation time={time} />
      </div>
      <ScrollArea>
        <ScrollBar orientation="horizontal" />
        <DataTable
          columns={columns}
          data={channels}
          onSortingChange={(state) => setSorted(state?.[0]?.id)}
          defaultSorting={[{ id: "engagement", desc: true }]}
        />
      </ScrollArea>
    </div>
  );
};
