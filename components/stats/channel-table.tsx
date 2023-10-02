"use client";

import { DailyChannelStats } from "@/lib/types";
import { ColumnDef, Row, SortingColumn } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import { Button } from "../ui/button";
import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
} from "@radix-ui/react-icons";
import { format } from "date-fns";

const StatHeader = ({
  column,
  icon,
  children,
  align = "center",
}: {
  column: ColumnDef<DailyChannelStats> & SortingColumn<DailyChannelStats>;
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
  row: Row<DailyChannelStats>;
  field: string;
}) => {
  const current = row.getValue(field) as number;

  return (
    <div className="flex flex-row items-center justify-center text-center">
      {current.toFixed(0)}
    </div>
  );
};

export const ChannelTable = ({ data }: { data: DailyChannelStats[] }) => {
  const columns: ColumnDef<DailyChannelStats>[] = [
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
            {format(new Date(utcDate), "MMM d, yyyy")}
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
      <DataTable
        columns={columns}
        data={data.reverse()}
        defaultSorting={[{ id: "timestamp", desc: true }]}
        hasRanking={false}
      />
    </div>
  );
};
