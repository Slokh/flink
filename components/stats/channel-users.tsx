"use client";

import { ChannelUserStats } from "@/lib/types";
import { ColumnDef, Row, SortingColumn } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
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
  column: ColumnDef<ChannelUserStats> & SortingColumn<ChannelUserStats>;
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
  row: Row<ChannelUserStats>;
  field: string;
}) => {
  const current = row.getValue(field) as number;

  return (
    <div className="flex flex-row items-center justify-center text-center">
      {current.toFixed(0)}
    </div>
  );
};

export const ChannelUsers = ({ data }: { data: ChannelUserStats[] }) => {
  const columns: ColumnDef<ChannelUserStats>[] = [
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <Link href={`/${user.fname}`} className="flex flex-row space-x-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.pfp} className="object-cover" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm">
              <div className="font-semibold">{user.display || user.fname}</div>
              <div className="text-zinc-500">{`@${user.fname}`}</div>
            </div>
          </Link>
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
