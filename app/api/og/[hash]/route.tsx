import { Embed, FarcasterCast, NftMetadata } from "@/lib/types";
import { ImageResponse } from "next/server";
import { Metadata } from "unfurl.js/dist/types";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: { hash: string } }
) {
  const res = await fetch(`https://flink.fyi/api/cast/${params.hash}`);
  const { cast }: { cast: FarcasterCast } = await res.json();
  const displayName =
    cast.user?.display || cast.user?.fname || `fid:${cast.user?.fid}`;
  const userName = cast.user?.fname
    ? `@${cast.user?.fname}`
    : `fid:${cast.user?.fid}`;

  const inter = await fetch(
    new URL("../../../../assets/Inter-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());
  const interSemiBold = await fetch(
    new URL("../../../../assets/Inter-SemiBold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());
  const interBold = await fetch(
    new URL("../../../../assets/Inter-Bold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  let offset = 0;
  let updatedMentionsPositions = []; // Array to store updated positions

  // Convert text to a Buffer object to deal with bytes
  let textBuffer = Buffer.from(cast.text, "utf-8");

  const sortedMentions = cast.mentions.sort((a, b) => b.position - a.position);

  for (let i = 0; i < sortedMentions.length; i++) {
    if (!sortedMentions[i].mention) continue;
    const adjustedMentionPosition = sortedMentions[i].position;
    const mentionUsername = sortedMentions[i].mention.fname;
    const mentionLinkBuffer = Buffer.from(`@${mentionUsername}`, "utf-8");
    const actualPosition = adjustedMentionPosition;
    const beforeMention = textBuffer.slice(0, actualPosition);
    const afterMention = textBuffer.slice(actualPosition);
    textBuffer = Buffer.concat([
      beforeMention,
      mentionLinkBuffer,
      afterMention,
    ]);
    offset += mentionLinkBuffer.length;
    updatedMentionsPositions.push(actualPosition);
  }

  const texts = textBuffer.toString("utf-8").split("\n");

  const getEmbed = (embed?: Embed) => {
    if (!embed) return;

    if (embed.url.includes("flink.fyi/polls")) {
      return {
        image: `https://flink.fyi/api/polls/${embed.url.split("/").pop()}/og`,
      };
    }

    if (embed.url.includes("i.imgur.com")) {
      return { image: embed.url };
    }

    if (
      !embed.contentMetadata ||
      Object.keys(embed.contentMetadata).length === 0
    ) {
      if (embed.contentType?.startsWith("image")) {
        return { image: embed.url };
      }
      return;
    }
    if (embed.url.startsWith("chain://")) {
      return { image: (embed.contentMetadata as NftMetadata).image_url };
    }
    const metadata = embed.contentMetadata as Metadata;
    if (!metadata?.open_graph && !metadata?.twitter_card) return;

    return {
      image:
        metadata?.open_graph?.images?.[0]?.url ||
        metadata?.twitter_card.images?.[0]?.url,
    };
  };

  const firstEmbed = getEmbed(cast.embeds[0]);
  const secondEmbed = getEmbed(cast.embeds[1]);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "black",
          color: "white",
          fontFamily: "Inter",
        }}
      >
        <div tw="flex flex-col p-4">
          <div tw="flex flex-row items-start justify-between h-28">
            <div tw="flex flex-row items-center">
              {cast.user?.pfp && (
                <img
                  tw="rounded-full w-24 h-24 flex"
                  src={cast.user?.pfp}
                  alt={displayName}
                />
              )}
              <div tw="flex flex-col ml-4">
                <div tw="text-4xl font-semibold">{displayName}</div>
                <div tw="text-2xl text-zinc-300">{userName}</div>
              </div>
            </div>
            <div tw="flex font-bold text-2xl">flink</div>
          </div>
          {cast.embeds[0]?.url?.includes("flink.fyi/polls") ? (
            <div tw="flex">
              <img
                src={firstEmbed?.image}
                style={{
                  objectFit: "contain",
                  maxHeight: "85%",
                }}
              />
            </div>
          ) : (
            <div tw="flex flex-col items-start justify-start h-[28rem]">
              <div tw="flex flex-col leading-6 w-full border rounded-lg text-4xl">
                {texts.map((text, i) => (
                  <div key={i} tw="flex">
                    {text}
                  </div>
                ))}
              </div>
              <div tw="flex flex-row items-start justify-start">
                {firstEmbed && (
                  <img
                    src={firstEmbed?.image}
                    style={{
                      objectFit: "contain",
                      maxHeight: "80%",
                      maxWidth: secondEmbed?.image ? "50%" : "100%",
                    }}
                  />
                )}
                {secondEmbed && (
                  <img
                    src={secondEmbed?.image}
                    style={{
                      objectFit: "contain",
                      maxHeight: "80%",
                      maxWidth: "50%",
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
        <div tw="bg-black h-8 flex justify-end items-center font-semibold text-xl px-2">
          <div tw="flex flex-row items-center text-red-500">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="https://www.w3.org/2000/svg"
            >
              <path
                d="M1.35248 4.90532C1.35248 2.94498 2.936 1.35248 4.89346 1.35248C6.25769 1.35248 6.86058 1.92336 7.50002 2.93545C8.13946 1.92336 8.74235 1.35248 10.1066 1.35248C12.064 1.35248 13.6476 2.94498 13.6476 4.90532C13.6476 6.74041 12.6013 8.50508 11.4008 9.96927C10.2636 11.3562 8.92194 12.5508 8.00601 13.3664C7.94645 13.4194 7.88869 13.4709 7.83291 13.5206C7.64324 13.6899 7.3568 13.6899 7.16713 13.5206C7.11135 13.4709 7.05359 13.4194 6.99403 13.3664C6.0781 12.5508 4.73641 11.3562 3.59926 9.96927C2.39872 8.50508 1.35248 6.74041 1.35248 4.90532Z"
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
              ></path>
            </svg>
            <div tw="flex pl-1 text-white">{`${cast.likes} likes`}</div>
          </div>
          <div tw="flex flex-row items-center text-green-500 pl-4">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="https://www.w3.org/2000/svg"
            >
              <path
                d="M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.64538 3.15554 4.3262C2.44102 5.13021 1.90321 6.10154 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3546 11.7585 10.6738C12.4731 9.86976 13.0109 8.89844 13.0109 7.70321Z"
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
              ></path>
            </svg>
            <div tw="flex pl-1 text-white">{`${cast.recasts} recasts`}</div>
          </div>
          <div tw="flex flex-row items-center text-zinc-500 pl-4">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="https://www.w3.org/2000/svg"
            >
              <path
                d="M12.5 3L2.5 3.00002C1.67157 3.00002 1 3.6716 1 4.50002V9.50003C1 10.3285 1.67157 11 2.5 11H7.50003C7.63264 11 7.75982 11.0527 7.85358 11.1465L10 13.2929V11.5C10 11.2239 10.2239 11 10.5 11H12.5C13.3284 11 14 10.3285 14 9.50003V4.5C14 3.67157 13.3284 3 12.5 3ZM2.49999 2.00002L12.5 2C13.8807 2 15 3.11929 15 4.5V9.50003C15 10.8807 13.8807 12 12.5 12H11V14.5C11 14.7022 10.8782 14.8845 10.6913 14.9619C10.5045 15.0393 10.2894 14.9965 10.1464 14.8536L7.29292 12H2.5C1.11929 12 0 10.8807 0 9.50003V4.50002C0 3.11931 1.11928 2.00003 2.49999 2.00002Z"
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
              ></path>
            </svg>
            <div tw="flex pl-1 text-white">{`${cast.replies} replies`}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: inter,
          style: "normal",
          weight: 400,
        },
        {
          name: "Inter",
          data: interSemiBold,
          style: "normal",
          weight: 600,
        },
        {
          name: "Inter",
          data: interBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
