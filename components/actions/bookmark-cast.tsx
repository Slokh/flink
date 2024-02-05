"use client";

import { useUser } from "@/context/user";
import { FarcasterCast } from "@/lib/types";
import { useEffect, useState } from "react";

export const BookmarkCast = ({ cast }: { cast: FarcasterCast }) => {
	const [isBookmarked, setIsBookmarked] = useState(false);
	const { user } = useUser();

	useEffect(() => {
		setIsBookmarked(user?.bookmarks[cast.hash] ?? false);
	}, [cast.hash, user?.bookmarks]);

	const bookmarkCast = async () => {
		if (!user) return;
		setIsBookmarked(!isBookmarked);
		const method = isBookmarked ? "DELETE" : "POST";
		await fetch(`/api/auth/${user?.fid}/bookmarks`, {
			method,
			body: JSON.stringify({
				targetFid: cast.user?.fid,
				targetHash: cast.hash,
				topParentUrl: cast.topParentUrl,
			}),
		});
	};

	if (!user) return <></>;

	return (
		<div className="hover:underline cursor-pointer" onClick={bookmarkCast}>
			{isBookmarked ? "unsave" : "save"}
		</div>
	);
};
