/* eslint-disable @next/next/no-img-element */
"use client";

import { ScrollArea } from "../ui/scroll-area";
import {
	DashIcon,
	ImageIcon,
	RowsIcon,
	TriangleDownIcon,
	TriangleUpIcon,
} from "@radix-ui/react-icons";
import { ChannelStats, DisplayMode } from "@/lib/types";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ChannelSelect } from "./channel-select";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "../ui/collapsible";
import { useEffect, useState } from "react";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { useUser } from "@/context/user";
import { NewCastButton } from "../actions/new-cast";

export const ChannelSidebarDisplay = ({
	channels,
}: {
	channels?: ChannelStats[];
}) => {
	const { channels: followedChannels } = useUser();
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const sidebarOpen = JSON.parse(
			localStorage.getItem("sidebarOpen") || "false",
		);
		if (sidebarOpen !== null) {
			setOpen(sidebarOpen);
		}
	}, []);

	const handleOpenChange = () => {
		const newOpenState = !open;
		localStorage.setItem("sidebarOpen", JSON.stringify(newOpenState));
		setOpen(newOpenState);
	};

	return (
		<div className="hidden md:flex">
			<Collapsible
				open={open}
				onOpenChange={handleOpenChange}
				className="flex flex-row border-l"
			>
				{channels && (
					<CollapsibleContent
						className={`h-full border-r items-start absolute z-10 bg-background right-12 border-l ${
							open ? "translate-x-0" : "translate-x-full"
						}`}
						style={{ boxShadow: "-10px 0px 20px rgba(0, 0, 0, 0.05)" }}
					>
						<div className="flex flex-col max-w-full h-full">
							<div className="flex flex-row items-center border-b h-12 flex-shrink-0">
								<div className="flex flex-row items-center w-full justify-between text-sm p-2 whitespace-nowrap">
									<div className="font-semibold mr-2">
										Trending Channels{" "}
										<span className="text-xs text-muted-foreground">
											(last 6h)
										</span>
									</div>
									<ChannelSelect
										suffix={
											/channels\/.*\/stats/.test(pathname)
												? `/stats${pathname.endsWith("users") ? "/users" : ""}`
												: ""
										}
									/>
								</div>
							</div>
							<ScrollArea className="h-full">
								{channels
									.filter(({ posts, replies }) => posts + replies > 0)
									.map((channel, i) => {
										const isUnknown =
											channel.channel.name === channel.channel.parentUrl &&
											channel.channel.channelId === channel.channel.parentUrl;
										const delta = channel.rankDeltas.engagement;
										return (
											<div
												key={channel.channel.channelId}
												className="flex flex-row items-center justify-between border-b h-12 pr-4"
											>
												<div className="flex flex-row items-center">
													<div className="flex flex-col items-center w-10 text-xs">
														<div>{i + 1}</div>
														<div className="flex flex-row items-center text-muted-foreground">
															{delta > 0 ? (
																<TriangleUpIcon className="text-green-500" />
															) : delta < 0 ? (
																<TriangleDownIcon className="text-red-500" />
															) : (
																<DashIcon className="ext-zinc-500" />
															)}
															<div>
																{delta > 0
																	? delta
																	: delta < 0
																	  ? delta.toString().substring(1)
																	  : ""}
															</div>
														</div>
													</div>
													{isUnknown ? (
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger>
																	<a
																		href={`/f/${encodeURIComponent(
																			channel.channel.channelId,
																		)}`}
																		className="flex flex-row space-x-2 items-center transition cursor-pointer p-1"
																	>
																		<Avatar className="h-6 w-6">
																			<AvatarImage
																				src={channel.channel.image}
																				className="object-cover"
																			/>
																			<AvatarFallback>?</AvatarFallback>
																		</Avatar>
																		<div className="text-muted-foreground text-sm">
																			Unknown
																		</div>
																	</a>
																</TooltipTrigger>
																<TooltipContent>
																	<div>
																		This is a new channel and has not been
																		registered on flink yet.
																	</div>
																	<div>
																		<b>Channel URL: </b>
																		{channel.channel.parentUrl}
																	</div>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													) : (
														<Link
															href={`/f/${channel.channel.channelId}${
																/channels\/.*\/stats/.test(pathname)
																	? `/stats${
																			pathname.endsWith("users") ? "/users" : ""
																	  }`
																	: ""
															}`}
															className="flex flex-row space-x-2 items-center hover:text-purple-600 hover:dark:text-purple-400 transition p-1"
														>
															<Avatar className="h-6 w-6">
																<AvatarImage
																	src={channel.channel.image}
																	className="object-cover"
																/>
																<AvatarFallback>?</AvatarFallback>
															</Avatar>
															<div className="font-semibold text-sm">
																{channel.channel.name}
															</div>
														</Link>
													)}
												</div>
												<div className="flex flex-col items-end space-x-1 text-xs">
													<div className="flex flex-row space-x-1">
														<div className="text-muted-foreground">Posts:</div>
														<div>{channel.posts}</div>
													</div>
													<div className="flex flex-row space-x-1">
														<div className="text-muted-foreground">
															Replies:
														</div>
														<div>{channel.replies}</div>
													</div>
												</div>
											</div>
										);
									})}
							</ScrollArea>
						</div>
					</CollapsibleContent>
				)}
				<div className="h-full w-12 flex flex-col justify-between">
					<div>
						<NewCastButton />
						{channels && (
							<SidebarButton label="Trending channels">
								<CollapsibleTrigger asChild>
									<div className="p-2 rounded-none w-12 h-12 flex justify-center items-center hover:bg-border transition-all">
										<svg
											xmlns="https://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="w-6 h-6"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
											/>
										</svg>
									</div>
								</CollapsibleTrigger>
							</SidebarButton>
						)}
						{followedChannels.map((url) => {
							const channel = CHANNELS_BY_URL[url] || {
								name: "Unknown",
								channelId: url,
								image: "",
								parentUrl: url,
							};
							return (
								<SidebarButton
									key={url}
									label={channel.name}
									href={`/f/${channel.channelId}`}
								>
									{channel.image ? (
										<img
											src={channel.image}
											className="w-8 h-8 rounded-full"
											alt={channel.name}
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
											?
										</div>
									)}
								</SidebarButton>
							);
						})}
					</div>
					{/* {!pathname.includes("/stats") && (
            <SidebarButton
              label="Change display mode"
              borderTop
              onClick={() =>
                changeDisplayMode(
                  displayMode === DisplayMode.Default
                    ? DisplayMode.Images
                    : DisplayMode.Default
                )
              }
            >
              {displayMode === DisplayMode.Default ? (
                <RowsIcon />
              ) : (
                <ImageIcon />
              )}
            </SidebarButton>
          )} */}
				</div>
			</Collapsible>
		</div>
	);
};

export const SidebarButton = ({
	label,
	children,
	href,
	onClick,
	borderTop,
}: {
	label: string;
	children: React.ReactNode;
	href?: string;
	onClick?: () => void;
	borderTop?: boolean;
}) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger>
				{href ? (
					<Link
						href={href}
						className={`p-2 w-12 h-12 flex items-center justify-center hover:bg-border transition-all border-${
							borderTop ? "t" : "b"
						}`}
					>
						{children}
					</Link>
				) : (
					<div
						className={`p-2 w-12 h-12 flex items-center justify-center hover:bg-border transition-all border-${
							borderTop ? "t" : "b"
						}`}
						onClick={onClick}
					>
						{children}
					</div>
				)}
			</TooltipTrigger>
			<TooltipContent side="left">
				<p>{label}</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
);
