"use client";

import { ChannelMember } from "@/lib/types";
import { ColumnDef, Row, SortingColumn } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import Link from "next/link";
import { FollowUsers } from "../actions/follow-users";

const StatHeader = ({
  column,
  icon,
  children,
  align = "center",
  tooltip,
}: {
  column: ColumnDef<ChannelMember> & SortingColumn<ChannelMember>;
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
              column.toggleSorting(true);
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
  row: Row<ChannelMember>;
  field: string;
}) => {
  const current = row.getValue(field);

  if (!current) {
    return (
      <div className="flex flex-row items-center justify-center text-center text-muted-foreground text-xs">
        -
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center justify-center text-center">
      {(current as number).toFixed(0)}
    </div>
  );
};

export const MembersTable = ({ members }: { members: ChannelMember[] }) => {
  const columns: ColumnDef<ChannelMember>[] = [
    {
      accessorKey: "token",
      header: "User",
      cell: ({ row }) => {
        const token = row.original.token;
        const user = row.original.user;
        return (
          <Link
            href={`/${user?.fname}`}
            className="flex flex-row space-x-2 group"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={token.metadata.image}
                className="object-cover"
              />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm">
              <div className="font-semibold group-hover:text-purple-600 group-hover:dark:text-purple-400 transition">
                {user?.display || user?.fname}
              </div>
              <div className="text-muted-foreground">{token.metadata.name}</div>
            </div>
          </Link>
        );
      },
    },
    {
      id: "followers",
      accessorKey: "followers",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="# of followers">
          Followers
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="followers" />,
    },
    {
      id: "recentActivity.posts",
      accessorKey: "recentActivity.posts",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="posts in last 7 days">
          7D Posts
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="recentActivity.posts" />,
    },
    {
      id: "recentActivity.replies",
      accessorKey: "recentActivity.replies",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="replies in last 7 days">
          7D Replies
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="recentActivity.replies" />,
    },
    {
      id: "allActivity.posts",
      accessorKey: "allActivity.posts",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="posts all time">
          Total Posts
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="allActivity.posts" />,
    },
    {
      id: "allActivity.replies",
      accessorKey: "allActivity.replies",
      header: ({ column }) => (
        <StatHeader column={column} tooltip="replies all time">
          Total Replies
        </StatHeader>
      ),
      cell: ({ row }) => <StatField row={row} field="allActivity.replies" />,
    },
  ];

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-end p-2 space-x-2 items-center">
        <div className="text-muted-foreground text-sm">
          {`${members.length} / ${members[0].collection.quantity} members on Farcaster`}
        </div>
        <FollowUsers fids={members.map((m) => m.user?.fid)} />
      </div>
      <ScrollArea>
        <ScrollBar orientation="horizontal" />
        <DataTable
          columns={columns}
          data={members}
          defaultSorting={[{ id: "followers", desc: true }]}
        />
      </ScrollArea>
    </div>
  );
};
