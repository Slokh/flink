/* eslint-disable @next/next/no-img-element */
"use client";
import { CameraIcon, Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useEffect, useRef, useState } from "react";
import { Loading } from "../loading";
import { usePathname } from "next/navigation";
import { CHANNELS_BY_ID } from "@/lib/channels";
import { Channel, Embed, FarcasterCast } from "@/lib/types";
import { CastChannelSelect } from "../channels/channel-select";
import { CastContent } from "../casts/cast-thread";
import { ScrollArea } from "../ui/scroll-area";
import { EmbedPreview } from "../embeds";
import { useUser } from "@/context/user";
import { FileUpload } from "../file-upload";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatText, generateId } from "@/lib/utils";
import { formatDistanceStrict } from "date-fns";
import { ContentState, Editor, EditorState, Modifier } from "draft-js";
import "draft-js/dist/Draft.css";
import { Card } from "../ui/card";
import { VideoPlayer } from "../video-player";
import { LongCast } from "./new-long-cast";
import { Poll } from "./new-poll";

export type Cast = {
  id: string;
  text: string;
  embeds: { url: string }[];
  isValid: boolean;
  pollData?: {
    prompt: string;
    options: string[];
  };
};

const createNewCast = (): Cast => {
  return {
    id: generateId(),
    text: "",
    embeds: [],
    isValid: false,
  };
};

const CastEditor = ({
  cast,
  onChange,
  onRemove,
  autoFocus,
  prefix,
}: {
  cast: Cast;
  onChange: (c: Partial<Cast>) => void;
  onRemove?: () => void;
  autoFocus?: boolean;
  prefix?: string;
}) => {
  const editorRef = useRef(null);
  const [editorState, setEditorState] = useState(() =>
    prefix
      ? EditorState.createWithContent(ContentState.createFromText(prefix))
      : EditorState.createEmpty()
  );
  const [embeds, setEmbeds] = useState<Embed[]>([]);
  const [files, setFiles] = useState<Embed[]>([]);
  const [fetchedEmbeds, setFetchedEmbeds] = useState<Record<string, Embed>>({});
  const [loading, setLoading] = useState(false);

  const getLength = (e: EditorState) =>
    new TextEncoder().encode(e.getCurrentContent().getPlainText()).length;

  const handleChange = (newState: EditorState) => {
    const maxLength = 320 - (prefix?.length || 0);
    let content = newState.getCurrentContent().getPlainText();

    // Get the current selection
    const selection = newState.getSelection();
    const key = selection.getAnchorKey();
    const block = newState.getCurrentContent().getBlockForKey(key);
    const start = selection.getStartOffset();
    const end = selection.getEndOffset();
    const lastCharacter = block.getText().slice(start - 1, end);

    // Ensure prefix is always at the start
    if (prefix && !content.startsWith(prefix) && lastCharacter !== prefix) {
      content = prefix + content;
      const contentState = ContentState.createFromText(content);
      newState = EditorState.createWithContent(contentState);
    }
    const isValid = content.length > 0 && getLength(newState) <= maxLength;

    const fetchEmbed = async (url: string) => {
      if (fetchedEmbeds[url]) return fetchedEmbeds[url];
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const metadata = await res.json();
      return metadata;
    };

    const fetchEmbeds = async (urls: string[]) => {
      setLoading(true);
      const newFetchedEmbeds = (await Promise.all(urls.map(fetchEmbed)))
        .filter(
          ({ contentMetadata, contentType }) =>
            Object.keys(contentMetadata).length > 0 ||
            contentType.startsWith("image") ||
            contentType.startsWith("video")
        )
        .slice(0, 2 - files.length);
      const newFetchedEmbedsMap = newFetchedEmbeds.reduce(
        (acc, embed) => ({ ...acc, [embed.url]: embed }),
        {}
      );

      setFetchedEmbeds({ ...fetchedEmbeds, ...newFetchedEmbedsMap });
      setEmbeds(newFetchedEmbeds);
      onChange({
        text: content,
        isValid,
        embeds: [
          ...files.map((file) => ({
            url: file.url,
          })),
          ...newFetchedEmbeds.map((embed) => ({
            url: embed.url,
          })),
        ],
      });
      setLoading(false);
    };

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    if (urls && files.length < 2) {
      fetchEmbeds(urls);
    } else {
      onChange({
        text: content,
        isValid,
      });
    }

    setEditorState(newState);
  };

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      // @ts-ignore
      editorRef.current.focus();
    }
  }, [autoFocus]);

  const appendVideo = (url: string) => {
    const contentState = editorState.getCurrentContent();
    const selectionToInsert = contentState.getSelectionAfter();
    const newContentState = Modifier.insertText(
      contentState,
      selectionToInsert,
      url
    );

    return EditorState.push(editorState, newContentState, "insert-characters");
  };

  return (
    <div className="flex flex-col">
      <div className="relative border rounded-lg w-[270px] sm:w-[462px] p-1 overflow-wrap break-word">
        {onRemove && (
          <div
            className="absolute z-50 top-2 right-2 cursor-pointer hover:bg-muted rounded-full w-5 h-5 flex items-center justify-center transition"
            onClick={() => onRemove()}
          >
            <Cross1Icon className="w-3 h-3" />
          </div>
        )}
        <div className="p-1">
          <Editor
            ref={editorRef}
            editorState={editorState}
            onChange={handleChange}
            placeholder="Type your cast here..."
          />
        </div>
        <div className="flex flex-row justify-between items-end w-full mt-1">
          <span
            className={`text-xs${
              getLength(editorState) > 320 ? " text-red-500" : ""
            }`}
          >
            {`${editorState.getCurrentContent().getPlainText("").length}/320`}
          </span>
          <div className="flex flex-row space-x-2">
            <FileUpload
              isDisabled={files.length + embeds.length >= 2}
              onFileUpload={({ url, contentType, urlHost }) => {
                if (contentType.startsWith("video")) {
                  setEditorState(appendVideo(url));
                  return;
                }
                const newFiles = [
                  ...files,
                  {
                    url,
                    urlHost,
                    contentType,
                    parsed: false,
                  },
                ];
                setFiles(newFiles);
                onChange({
                  embeds: [
                    ...newFiles.map((file) => ({
                      url: file.url,
                    })),
                    ...embeds.map((embed) => ({
                      url: embed.url,
                    })),
                  ],
                });
              }}
            >
              {loading ? (
                <div className="p-2 cursor-pointer border rounded-lg ">
                  <Loading />
                </div>
              ) : files.length + embeds.length >= 2 ? (
                <div className="p-2 cursor-pointer border rounded-lg text-zinc-500">
                  <CameraIcon className="h-4 w-4" />
                </div>
              ) : (
                <div className="p-2 cursor-pointer border rounded-lg">
                  <CameraIcon className="h-4 w-4" />
                </div>
              )}
            </FileUpload>
          </div>
        </div>
      </div>
      <ScrollArea>
        <div className="flex flex-col">
          {files.map((file, i) => (
            <div
              key={file.url}
              className="mt-2 relative flex justify-center w-full"
            >
              {file.contentType.startsWith("image/") ? (
                <img src={file.url} alt="embed" />
              ) : (
                <VideoPlayer url={file.url} />
              )}
              <div
                className="absolute z-50 top-1 right-1 cursor-pointer bg-background hover:bg-muted rounded-full w-5 h-5 flex items-center justify-center transition"
                onClick={() => {
                  const newFiles = [...files];
                  newFiles.splice(i, 1);
                  setFiles(newFiles);
                }}
              >
                <Cross1Icon className="h-3 w-3" />
              </div>
            </div>
          ))}
          {embeds.map((embed, i) => (
            <div key={embed.url} className="mt-2 relative">
              <EmbedPreview embed={embed} />
              <div
                className="absolute z-50 top-1 right-1 cursor-pointer bg-background hover:bg-muted rounded-full w-5 h-5 flex items-center justify-center transition"
                onClick={() => {
                  const newEmbeds = [...embeds];
                  newEmbeds.splice(i, 1);
                  setEmbeds(newEmbeds);
                }}
              >
                <Cross1Icon className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const NewCastContent = ({
  parent,
  children,
  xpost,
  inThread,
  pollOption,
}: {
  parent?: string;
  children?: React.ReactNode;
  xpost?: FarcasterCast;
  inThread?: boolean;
  pollOption?: number;
}) => {
  const [loading, setLoading] = useState(true);
  const [casts, setCasts] = useState<Cast[]>([createNewCast()]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();

  const pathname = usePathname();
  const [channel, setChannel] = useState<Channel | undefined>();
  const [isValid, setIsValid] = useState(false);
  const [option, setOption] = useState("cast");

  useEffect(() => {
    if (!parent && pathname.includes("/f/")) {
      setChannel(CHANNELS_BY_ID[pathname.split("/")[2]]);
    }
    setLoading(false);
  }, [parent, pathname]);

  const handlePollSubmit = async () => {
    setSubmitting(true);

    const res = await fetch(`/api/auth/${user?.fid}/polls`, {
      method: "POST",
      body: JSON.stringify({
        prompt: casts[0].pollData?.prompt,
        options: casts[0].pollData?.options,
      }),
    });

    if (res.status === 200) {
      const { poll } = await res.json();
      const res2 = await fetch(`/api/auth/${user?.fid}/casts`, {
        method: "POST",
        body: JSON.stringify({
          casts: [
            {
              text: casts[0].text,
              embeds: [{ url: `https://flink.fyi/polls/${poll}` }],
              parent: parent || channel?.parentUrl,
            },
          ],
        }),
      });
      const data2 = await res2.json();
      const hash = data2.casts[0].cast.hash;

      await fetch(`/api/auth/${user?.fid}/polls/${poll}`, {
        method: "POST",
        body: JSON.stringify({
          hash,
        }),
      });

      if (inThread) {
        // @ts-ignore
        window.location.reload();
      } else {
        // @ts-ignore
        window.location = `/${user?.fname}/${hash}`;
      }
    }
    setSubmitting(false);
  };

  const handleLongSubmit = async () => {
    setSubmitting(true);
    const base64string = casts[0].text.split(",")[1];

    const res = await fetch(`/api/auth/${user?.fid}/upload/image`, {
      method: "POST",
      body: JSON.stringify({
        image: base64string,
      }),
    });

    if (res.status === 200) {
      const { data } = await res.json();
      const res2 = await fetch(`/api/auth/${user?.fid}/casts`, {
        method: "POST",
        body: JSON.stringify({
          casts: [
            {
              text: "",
              embeds: [{ url: data.link }],
              parent: parent || channel?.parentUrl,
            },
          ],
        }),
      });
      const data2 = await res2.json();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (inThread) {
        // @ts-ignore
        window.location.reload();
      } else {
        // @ts-ignore
        window.location = `/${user?.fname}/${data2.casts[0].cast.hash}`;
      }
    }
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (option === "long-cast") await handleLongSubmit();
    if (option === "poll") await handlePollSubmit();

    setSubmitting(true);
    const castsWithParent = casts.map((cast) => ({
      text: cast.text,
      embeds: cast.embeds,
      parent: parent || channel?.parentUrl,
    }));
    const res = await fetch(`/api/auth/${user?.fid}/casts`, {
      method: "POST",
      body: JSON.stringify({
        casts: castsWithParent,
      }),
    });
    const data = await res.json();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (inThread) {
      // @ts-ignore
      window.location.reload();
    } else {
      // @ts-ignore
      window.location = `/${user?.fname}/${data.casts[0].cast.hash}`;
    }
  };

  const handleCastChange = (i: number, cast: Partial<Cast>) => {
    const newCasts = [...casts];
    newCasts[i] = { ...newCasts[i], ...cast };
    setCasts(newCasts);
    setIsValid(newCasts.every((c) => c.isValid));
  };

  return (
    <div className="flex flex-col space-y-4">
      <ScrollArea style={{ maxHeight: "calc(100vh - 300px" }}>
        <div className="flex flex-col space-y-4 w-[270px] sm:w-[462px]">
          {!xpost ? children : <></>}
          <div className="flex flex-col space-y-2">
            <div className="flex flex-row space-x-2">
              <div
                className={
                  option === "cast"
                    ? "cursor-pointer text-sm text-background bg-foreground rounded-xl px-2 py-0.5 font-semibold"
                    : "cursor-pointer text-sm text-muted-foreground rounded-xl px-2 py-0.5 hover:text-foreground"
                }
                onClick={() => setOption("cast")}
              >
                Cast
              </div>
              {!pollOption && (
                <div
                  className={
                    option === "long-cast"
                      ? "cursor-pointer text-sm text-background bg-foreground rounded-xl px-2 py-0.5 font-semibold"
                      : "cursor-pointer text-sm text-muted-foreground rounded-xl px-2 py-0.5 hover:text-foreground"
                  }
                  onClick={() => setOption("long-cast")}
                >
                  Long Cast
                </div>
              )}
              {(!parent || channel) && !pollOption && (
                <div
                  className={
                    option === "poll"
                      ? "cursor-pointer text-sm text-background bg-foreground rounded-xl px-2 py-0.5 font-semibold"
                      : "cursor-pointer text-sm text-muted-foreground rounded-xl px-2 py-0.5 hover:text-foreground"
                  }
                  onClick={() => setOption("poll")}
                >
                  Poll
                </div>
              )}
            </div>
            {option === "cast" &&
              casts.map((cast, i) => (
                <CastEditor
                  key={cast.id}
                  cast={cast}
                  onChange={(c) => handleCastChange(i, c)}
                  onRemove={
                    i === 0
                      ? undefined
                      : () => {
                          setCasts(casts.filter((_, j) => j !== i));
                        }
                  }
                  autoFocus={i === casts.length - 1}
                  prefix={pollOption ? `${pollOption}` : undefined}
                />
              ))}
            {option === "long-cast" && (
              <LongCast onChange={(c) => handleCastChange(0, c)} />
            )}
            {option === "poll" && (
              <Poll onChange={(c) => handleCastChange(0, c)} />
            )}
          </div>
          {xpost ? children : <></>}
        </div>
      </ScrollArea>
      <div className="flex flex-row justify-between items-center mt-2 space-x-2">
        <div>
          {!parent && !loading && (
            <CastChannelSelect
              channel={channel?.channelId}
              onChange={(value: string) => setChannel(CHANNELS_BY_ID[value])}
            />
          )}
          {pollOption && (
            <div className="text-xs">
              Note: Your vote selection ({pollOption}) will be prefixed at the
              start of your cast.
            </div>
          )}
        </div>
        <div className="flex flex-row space-x-2 items-center">
          {!xpost && option === "cast" && !pollOption && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                setCasts([...casts, createNewCast()]);
              }}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          )}
          <Button disabled={submitting || !isValid} onClick={handleSubmit}>
            {submitting ? <Loading /> : "Cast"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const NewCastDialog = ({
  header,
  children,
  inThread,
  content,
  hash,
  pollOption,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  inThread?: boolean;
  content?: React.ReactNode;
  hash?: string;
  pollOption?: number;
}) => {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  if (!user) return <></>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent
        className="max-h-full"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>{header}</DialogHeader>
        <NewCastContent
          parent={hash}
          inThread={inThread}
          pollOption={pollOption}
        >
          {content}
        </NewCastContent>
      </DialogContent>
    </Dialog>
  );
};

export const NewCastButton = () => (
  <NewCastDialog header={<DialogTitle>New cast</DialogTitle>}>
    <div className="p-2 rounded-none w-12 h-12 flex justify-center items-center hover:bg-muted-foreground transition-all bg-foreground text-background">
      <svg
        xmlns="https://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.25"
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    </div>
  </NewCastDialog>
);

export const ReplyCastButton = ({
  parent,
  inThread,
}: {
  parent: FarcasterCast;
  inThread?: boolean;
}) => (
  <NewCastDialog
    content={<CastContent cast={parent} />}
    hash={parent.hash}
    inThread={inThread}
  >
    <div className="hover:underline">reply</div>
  </NewCastDialog>
);

export const PollVoteButton = ({
  hash,
  option,
}: {
  hash: string;
  option: number;
}) => (
  <NewCastDialog hash={hash} pollOption={option}>
    <Button size="sm" className="mr-2 mt-2">
      {option}
    </Button>
  </NewCastDialog>
);

export const XPostButton = ({ cast }: { cast: FarcasterCast }) => {
  const { user } = useUser();
  if (!user) return <></>;

  const formattedText = formatText(cast.text, cast.mentions, true);

  return (
    <Dialog>
      <DialogTrigger>
        <div className="hover:underline">quote</div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader></DialogHeader>
        <NewCastContent xpost={cast}>
          <Link
            href={`https://flink.fyi/${cast.user?.fname}/${cast.hash}`}
            className="max-w-lg w-full"
          >
            <Card className="rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-none">
              <div className="flex flex-col p-2 space-y-1">
                <div className="flex flex-row space-x-1 items-center text-sm">
                  <Avatar className="h-4 w-4">
                    <AvatarImage
                      src={cast.user?.pfp}
                      className="object-cover"
                    />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div className="font-semibold">
                    {cast.user?.display || cast.user?.fname}
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">{`@${cast.user?.fname}`}</div>
                  <div
                    className="text-muted-foreground"
                    title={new Date(cast.timestamp).toLocaleString()}
                  >
                    {formatDistanceStrict(
                      new Date(cast.timestamp),
                      new Date(),
                      {
                        addSuffix: true,
                      }
                    )}
                  </div>
                </div>
                <div className="text-muted-foreground text-sm line-clamp-4 flex flex-col whitespace-pre-wrap break-words leading-6 tracking-normal w-full space-y-2">
                  <div dangerouslySetInnerHTML={{ __html: formattedText }} />
                  {cast.embeds.length > 0 && (
                    <div className="flex flex-row flex-wrap">
                      {cast.embeds.map((embed, i) => (
                        <div key={i} className="w-1/2 pr-2">
                          <EmbedPreview embed={embed} user={cast.user} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        </NewCastContent>
      </DialogContent>
    </Dialog>
  );
};
