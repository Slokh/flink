import { formatText } from "@/lib/utils";
import { CHANNELS_BY_URL } from "@/lib/channels";
import { FarcasterCast, FarcasterCastTree } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceStrict } from "date-fns";
import { EmbedPreview } from "../embeds";
import { MobileCast } from "./cast";
import { CopyLink } from "../copy-link";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import Link from "next/link";
import { DeleteCast } from "../actions/delete-cast";
import { ReplyCastButton, XPostButton } from "../actions/new-cast";
import { LikeCast } from "../actions/like-cast";
import { RecastCast } from "../actions/recast-cast";
import { CollapsibleCast } from "./collapsible-cast";
import { User } from "../user";
import { BookmarkCast } from "../actions/bookmark-cast";

export const CastContent = ({
	cast,
	onlyContent,
}: {
	cast: FarcasterCast;
	onlyContent?: boolean;
}) => {
	const channel = cast.parentUrl ? CHANNELS_BY_URL[cast.parentUrl] : undefined;
	const formattedText = formatText(cast.text, cast.mentions, true);

	const user = cast.user || {
		fname: "unknown",
		pfp: "",
	};

	return (
		<div className="flex flex-col space-y-1">
			{!onlyContent ? (
				<div className="flex flex-row space-x-2">
					<Link href={`/${user?.fname}`}>
						<Avatar className="h-10 w-10">
							<AvatarImage src={user?.pfp} className="object-cover" />
							<AvatarFallback>?</AvatarFallback>
						</Avatar>
					</Link>
					<div className="flex flex-col text-sm">
						<User user={user} showDisplay showUsername />
						<div className="flex flex-row space-x-1 text-sm">
							<div
								className="text-muted-foreground"
								title={new Date(cast.timestamp).toLocaleString()}
							>
								{formatDistanceStrict(new Date(cast.timestamp), new Date(), {
									addSuffix: true,
								})}
							</div>
							{channel && (
								<>
									<div className="text-muted-foreground">in</div>
									<Link
										href={`/f/${channel.channelId}`}
										className="hover:underline"
									>
										<Avatar className="h-4 w-4">
											<AvatarImage
												src={channel.image}
												className="object-cover"
											/>
											<AvatarFallback>?</AvatarFallback>
										</Avatar>
									</Link>
									<Link
										href={`/f/${channel.channelId}`}
										className="hover:underline"
									>
										<div>{channel.name}</div>
									</Link>
								</>
							)}
						</div>
					</div>
				</div>
			) : (
				<div
					className="text-muted-foreground"
					title={new Date(cast.timestamp).toLocaleString()}
				>
					{formatDistanceStrict(new Date(cast.timestamp), new Date(), {
						addSuffix: true,
					})}
				</div>
			)}
			<div className="flex flex-col whitespace-pre-wrap break-words leading-6 tracking-normal w-full space-y-2 border rounded-lg p-2">
				<div dangerouslySetInnerHTML={{ __html: formattedText }} />
				{cast.embeds.length > 0 && (
					<div className="flex flex-col space-y-2">
						{cast.embeds.map((embed, i) => (
							<div key={i} className="w-full max-w-md mt-2">
								<EmbedPreview
									embed={embed}
									text={formattedText}
									user={cast.user}
								/>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export const CastParent = ({
	cast,
	isHighlighted,
	onlyContent,
}: {
	cast: FarcasterCast;
	isHighlighted?: boolean;
	onlyContent?: boolean;
}) => {
	const channel = cast.parentUrl ? CHANNELS_BY_URL[cast.parentUrl] : undefined;

	const user = cast.user || {
		fname: "unknown",
		pfp: "",
	};

	return (
		<div
			className="flex flex-row space-x-2 pl-2 py-4 w-full pr-12"
			style={{ maxWidth: "calc(100vw - 96px)" }}
		>
			<div className="flex flex-col items-end justify-start text-sm">
				<LikeCast hash={cast.hash} likes={cast.likes} mode="icons" />
				<RecastCast hash={cast.hash} recasts={cast.recasts} mode="icons" />
			</div>
			<div className="flex flex-col space-y-1 w-full">
				<CastContent cast={cast} onlyContent={onlyContent} />
				<div className="text-muted-foreground text-sm flex flex-row space-x-4">
					{isHighlighted && (
						<Link
							href={`/${
								channel
									? `f/${channel.channelId}`
									: cast.topParentCast?.user?.fname
							}/${cast.topParentCast?.hash}`}
							className="hover:underline"
						>
							view thread
						</Link>
					)}
					<ReplyCastButton parent={cast} inThread />
					<a
						href={`https://warpcast.com/${user?.fname}/${cast.hash.slice(
							0,
							8,
						)}`}
						target="_blank"
						className="hover:underline"
					>
						warpcast
					</a>
					<CopyLink
						link={`https://flink.fyi/${
							channel ? `f/${channel.channelId}` : user?.fname
						}/${cast.hash}`}
					/>
					<XPostButton cast={cast} />
					<BookmarkCast cast={cast} />
					<DeleteCast hash={cast.hash}>
						<div className="hover:underline">delete</div>
					</DeleteCast>
				</div>
			</div>
		</div>
	);
};

export const CastThread = async ({
	cast,
	hash,
}: {
	cast: FarcasterCastTree;
	hash: string;
}) => {
	return (
		<>
			<div
				className="hidden md:flex flex-col h-full"
				style={{ width: "calc(100vw - 50px)" }}
			>
				<ScrollArea className="h-full pl-2">
					<ScrollBar orientation="horizontal" />
					<CastParent cast={cast} isHighlighted={hash !== cast.hash} />
					<div className="flex flex-col space-y-4 m-2">
						{cast.children.map((child) => (
							<CollapsibleCast
								key={child.hash}
								cast={child}
								isHighlighted={hash === child.hash}
								op={cast.user?.fid}
							/>
						))}
					</div>
				</ScrollArea>
			</div>
			<div className="flex md:hidden flex-col w-full">
				<MobileCast cast={cast} isLink={false} />
				{cast.children.map((child) => (
					<MobileCast key={child.hash} cast={child} />
				))}
			</div>
		</>
	);
};
