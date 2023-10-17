"use client";

import { UserStats } from "@/lib/types";
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
import { WithUserTooltip } from "../user";

export const UsersNavigation = ({ time }: { time: string }) => {
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
  tooltip,
}: {
  column: ColumnDef<UserStats> & SortingColumn<UserStats>;
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

const StatField = ({ row, field }: { row: Row<UserStats>; field: string }) => {
  const current = row.getValue(field) as number;

  return (
    <div className="flex flex-row items-center justify-center text-center">
      {current.toFixed(0)}
    </div>
  );
};

export const UsersTable = ({
  time,
  users,
}: {
  time: string;
  users: UserStats[];
}) => {
  const [sorted, setSorted] = useState<string>();
  const columns: ColumnDef<UserStats>[] = [
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
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <WithUserTooltip user={user}>
            <Link href={`/${user?.fname}`} className="flex flex-row space-x-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.pfp} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm">
                <div className="font-semibold">
                  {user?.display || user?.fname}
                </div>
                <div className="text-muted-foreground">{`@${user?.fname}`}</div>
              </div>
            </Link>
          </WithUserTooltip>
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
      <div className="flex flex-row items-center justify-end p-2 border-b">
        <UsersNavigation time={time} />
      </div>
      <ScrollArea>
        <ScrollBar orientation="horizontal" />
        <DataTable
          columns={columns}
          data={users}
          onSortingChange={(state) => setSorted(state?.[0]?.id)}
          defaultSorting={[{ id: "engagement", desc: true }]}
        />
      </ScrollArea>
    </div>
  );
};
