"use client";

import { FollowersStats } from "@/lib/types";
import { ColumnDef, Row, SortingColumn } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	CaretDownIcon,
	CaretSortIcon,
	CaretUpIcon,
} from "@radix-ui/react-icons";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import Link from "next/link";
import { WithUserTooltip } from "../user";
import { formatDistanceStrict } from "date-fns";

const StatHeader = ({
	column,
	icon,
	children,
	align = "center",
}: {
	column: ColumnDef<FollowersStats> & SortingColumn<FollowersStats>;
	icon?: React.ReactNode;
	children: React.ReactNode;
	align?: "start" | "center" | "end";
}) => (
	<div
		className={`flex flex-row items-center justify-${align} text-center cursor-pointer`}
	>
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
	</div>
);

export const FollowersTable = ({
	followers,
}: {
	followers: FollowersStats[];
}) => {
	const columns: ColumnDef<FollowersStats>[] = [
		{
			accessorKey: "user",
			header: "User",
			cell: ({ row }) => {
				const user = row.original.user;
				return (
					<div className="pl-4">
						<WithUserTooltip user={user}>
							<Link
								href={`/${user?.fname}`}
								className="flex flex-row space-x-2 group"
							>
								<Avatar className="h-10 w-10">
									<AvatarImage src={user?.pfp} className="object-cover" />
									<AvatarFallback>?</AvatarFallback>
								</Avatar>
								<div className="flex flex-col text-sm">
									<div className="font-semibold group-hover:text-purple-600 group-hover:dark:text-purple-400 transition">
										{user?.display || user?.fname}
									</div>
									<div className="text-muted-foreground">
										{user?.fname || `fid:${user?.fid}`}
									</div>
								</div>
							</Link>
						</WithUserTooltip>
					</div>
				);
			},
		},
		{
			id: "following",
			accessorKey: "user.following",
			header: ({ column }) => (
				<StatHeader column={column}>Following</StatHeader>
			),
			cell: ({ row }) => {
				return (
					<div className="flex flex-row justify-center">
						{row.original.user?.following}
					</div>
				);
			},
		},
		{
			id: "followers",
			accessorKey: "user.followers",
			header: ({ column }) => (
				<StatHeader column={column}>Followers</StatHeader>
			),
			cell: ({ row }) => {
				return (
					<div className="flex flex-row justify-center">
						{row.original.user?.followers}
					</div>
				);
			},
		},
		{
			id: "timestamp",
			accessorKey: "timestamp",
			header: ({ column }) => (
				<StatHeader column={column} align="end">
					Since
				</StatHeader>
			),
			cell: ({ row }) => {
				return (
					<div className="justify-end flex flex-row pr-4">
						{formatDistanceStrict(
							new Date(row.original.timestamp),
							new Date(),
							{ addSuffix: true },
						)}
					</div>
				);
			},
		},
	];

	return (
		<div className="flex flex-col w-full h-full">
			<ScrollArea>
				<ScrollBar orientation="horizontal" />
				<DataTable
					columns={columns}
					data={followers}
					defaultSorting={[{ id: "timestamp", desc: true }]}
					hasRanking={false}
				/>
			</ScrollArea>
		</div>
	);
};
