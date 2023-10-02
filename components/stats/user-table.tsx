"use client";

import { DailyUserStats } from "@/lib/types";
import { ColumnDef, Row, SortingColumn } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
} from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { format } from "date-fns";

const StatHeader = ({
  column,
  icon,
  children,
  align = "center",
  tooltip,
}: {
  column: ColumnDef<DailyUserStats> & SortingColumn<DailyUserStats>;
  icon?: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  tooltip?: string;
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
  row: Row<DailyUserStats>;
  field: string;
}) => {
  const current = row.getValue(field) as number;

  return (
    <div className="flex flex-row items-center justify-center text-center">
      {current.toFixed(0)}
    </div>
  );
};

export const UserTable = ({ data }: { data: DailyUserStats[] }) => {
  const columns: ColumnDef<DailyUserStats>[] = [
    {
      accessorKey: "timestamp",
      header: ({ column }) => <StatHeader column={column}>Date</StatHeader>,
      cell: ({ row }) => {
        const date = new Date(row.original.timestamp);
        const utcDate = new Date(
          date.getTime() + date.getTimezoneOffset() * 60000
        );
        return (
          <div className="flex flex-row items-center space-x-1 whitespace-nowrap">
            {format(utcDate, "MMM d, yyyy")}
          </div>
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
        data={data.reverse()}
        defaultSorting={[{ id: "timestamp", desc: true }]}
        hasRanking={false}
      />
    </div>
  );
};
