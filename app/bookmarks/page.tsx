"use client";

import { useUser } from "@/context/user";
import Loading from "../loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FarcasterCast } from "@/lib/types";
import { CastParent } from "@/components/casts/cast-thread";
import { MobileCast } from "@/components/casts/cast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CHANNELS_BY_URL } from "@/lib/channels";

const BookmarksDisplay = ({
  bookmarks,
  onlyContent,
}: {
  bookmarks: FarcasterCast[];
  onlyContent?: boolean;
}) => (
  <div className="flex flex-col">
    {bookmarks.map((cast, i) => (
      <>
        <div key={i} className="hidden md:flex">
          <CastParent cast={cast} onlyContent={onlyContent} />
        </div>
        <div key={i} className="flex md:hidden">
          <MobileCast cast={cast} />
        </div>
      </>
    ))}
  </div>
);

const UserDisplay = ({ bookmarks }: { bookmarks: FarcasterCast[] }) => {
  const userBookmarks = bookmarks.reduce((acc, bookmark) => {
    const user = bookmark.user;
    if (!acc[user.fid]) {
      acc[user.fid] = [];
    }
    acc[user.fid].push(bookmark);
    return acc;
  }, {} as Record<number, FarcasterCast[]>);

  return (
    <Accordion type="multiple">
      {Object.entries(userBookmarks).map(([fid, casts]) => (
        <AccordionItem value={fid} key={fid} className="border-b">
          <AccordionTrigger className="hover:no-underline hover:bg-border px-2">
            <div className="flex flex-row items-center space-x-2 text-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={casts[0].user.pfp} className="object-cover" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div>{casts[0].user.display}</div>
              <div className="text-purple-600 dark:text-purple-400">{`@${casts[0].user.fname}`}</div>
              <div>{`(${casts.length})`}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <BookmarksDisplay bookmarks={casts} onlyContent />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

const ChannelDisplay = ({ bookmarks }: { bookmarks: FarcasterCast[] }) => {
  const channelBookmarks = bookmarks.reduce((acc, bookmark) => {
    const channel = bookmark.topParentUrl || "none";
    if (!acc[channel]) {
      acc[channel] = [];
    }
    acc[channel].push(bookmark);
    return acc;
  }, {} as Record<string, FarcasterCast[]>);

  return (
    <Accordion type="multiple">
      {Object.entries(channelBookmarks).map(([url, casts]) => (
        <AccordionItem value={url} key={url} className="border-b">
          <AccordionTrigger className="hover:no-underline hover:bg-border px-2">
            <div className="flex flex-row items-center space-x-2 text-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={CHANNELS_BY_URL[url]?.image}
                  className="object-cover"
                />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div>{CHANNELS_BY_URL[url]?.name || "No channel"}</div>
              <div>{`(${casts.length})`}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <BookmarksDisplay bookmarks={casts} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<FarcasterCast[]>([]);
  const [selection, setSelection] = useState<string>();
  const { user } = useUser();

  const fetchBookmarks = async (fid: number) => {
    const res = await fetch(`/api/auth/${fid}/bookmarks`);
    const data = await res.json();
    setBookmarks(
      data.casts.sort(
        (a: FarcasterCast, b: FarcasterCast) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    );
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchBookmarks(user.fid);
  }, [user]);

  if (!user) return <div className="w-full"></div>;

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-row justify-between border-b items-center p-2">
        <div className="flex flex-col">
          <div className="text-2xl font-semibold">Bookmarks</div>
        </div>
        <div>
          <Select value={selection} onValueChange={(v) => setSelection(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Newest first" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Newest first</SelectItem>
              <SelectItem value="channels">By channels</SelectItem>
              <SelectItem value="users">By users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ScrollArea>
        {loading ? (
          <Loading />
        ) : bookmarks.length === 0 ? (
          <div>No bookmarks found.</div>
        ) : selection === "users" ? (
          <UserDisplay bookmarks={bookmarks} />
        ) : selection === "channels" ? (
          <ChannelDisplay bookmarks={bookmarks} />
        ) : (
          <BookmarksDisplay bookmarks={bookmarks} />
        )}
      </ScrollArea>
    </div>
  );
}
