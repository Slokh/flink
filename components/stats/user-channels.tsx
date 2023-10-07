"use client";

import { Channel, UserChannelStats } from "@/lib/types";
import { ColumnDef, Row, SortingColumn } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import { Button } from "../ui/button";
import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
} from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const StatHeader = ({
  column,
  icon,
  children,
  align = "center",
  tooltip,
}: {
  column: ColumnDef<UserChannelStats> & SortingColumn<UserChannelStats>;
  icon?: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  tooltip: string;
}) => (
  <div className={`flex flex-row items-center justify-${align} text-center`}>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            onClick={() => {
              if (column.getIsSorted() === "asc") {
                column.toggleSorting(true);
              } else if (column.getIsSorted() === "desc") {
                column.toggleSorting(false);
              } else {
                column.toggleSorting(true);
              }
            }}
            className="px-1 text-xs hover:bg-accent hover:text-accent-foreground flex flex-row py-2 rounded-md"
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
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

const StatField = ({
  row,
  field,
}: {
  row: Row<UserChannelStats>;
  field: string;
}) => {
  const current = row.getValue(field) as number;

  return (
    <div className="flex flex-row items-center justify-center text-center">
      {current.toFixed(0)}
    </div>
  );
};

export const UserChannels = ({ data }: { data: UserChannelStats[] }) => {
  const columns: ColumnDef<UserChannelStats>[] = [
    {
      header: "Channel",
      accessorKey: "channel",
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
        return channel.parentUrl === "uncategorized" ? (
          <a
            href={`/`}
            className="flex flex-row space-x-2 items-center hover:text-purple-600 hover:dark:text-purple-400 transition p-1"
          >
            <div className="text-muted-foreground">No Channel</div>
          </a>
        ) : isUnknown ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <a
                  href={`/channels/${encodeURIComponent(channel.channelId)}`}
                  className="flex flex-row space-x-2 items-center transition cursor-pointer p-1"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={channel.image} className="object-cover" />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div className="text-muted-foreground">Unknown</div>
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
            href={`/channels/${channel.channelId}`}
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
        <StatHeader column={column} icon="🔥" tooltip="activity score">
          Activity
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="engagement" />,
    },
    {
      accessorKey: "posts",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="# of casts">
          Posts
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="posts" />,
    },
    {
      accessorKey: "replies",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="# of replies">
          Replies
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="replies" />,
    },
    {
      accessorKey: "likes",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="# of likes received">
          Likes
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="likes" />,
    },
    {
      accessorKey: "recasts",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="# of recasts received">
          Recasts
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="recasts" />,
    },
    {
      accessorKey: "liked",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="# of likes given">
          Liked
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="liked" />,
    },
    {
      accessorKey: "recasted",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="# of recasts given">
          Recasted
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="recasted" />,
    },
    {
      accessorKey: "mentions",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="# of mentions">
          Mentions
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="mentions" />,
    },
  ];

  return (
    <div className="flex flex-col w-full h-full">
      <DataTable
        columns={columns}
        data={data}
        defaultSorting={[{ id: "engagement", desc: true }]}
      />
    </div>
  );
};
