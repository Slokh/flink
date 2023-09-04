import {
  FARCASTER_EPOCH,
  HubEventType,
  Message,
  MessageType,
} from "@farcaster/hub-nodejs";
import { Client, convertToHex } from "./hub";
import prisma from "../lib/prisma";
import {
  Cast,
  CastData,
  CastEmbed,
  CastMention,
  bulkUpsertCasts,
  bulkUpsertReactions,
  deleteCast,
  deleteReaction,
  resetFid,
  upsertCast,
  upsertReaction,
} from "../db/cast";
import { extractLinks } from "../links";

export const backfillFarcasterCasts = async (client: Client) => {
  const lastFidRecord = await prisma.backfill.findFirst({
    where: { type: "casts" },
    orderBy: { fid: "desc" },
    select: { fid: true },
  });

  const lastFid = lastFidRecord?.fid || 0;
  for (let fid = lastFid + 1; ; fid++) {
    await resetFid(fid);

    let pageToken: Uint8Array | undefined = undefined;
    do {
      const response = await client.client.getCastsByFid({
        fid,
        pageToken,
      });
      if (response.isOk()) {
        const messages = response.value.messages;
        console.log(
          `[backfill] [casts] [${fid}] processing ${messages.length} casts`
        );

        const castData = messages
          .map((message) => generateCastData(message))
          .filter(Boolean) as CastData[];
        await bulkUpsertCasts(castData);

        const reactions = await Promise.all(
          castData.map((cast) =>
            client.getCastReactions(cast.fid, cast.rawHash)
          )
        );
        await bulkUpsertReactions(reactions.flat());

        pageToken = response.value.nextPageToken;
      } else {
        throw new Error(
          `[backfill] failed to get casts for fid ${fid} - ${response.error}]`
        );
      }
    } while (pageToken?.length);

    await prisma.backfill.create({ data: { fid, type: "casts" } });
  }
};

export const watchFarcasterCasts = async (client: Client) => {
  const subscribtion = await client.subscribe({
    eventTypes: [HubEventType.MERGE_MESSAGE],
  });
  if (!subscribtion.isOk()) {
    console.error("Failed to subscribe to hub events");
    process.exit(1);
  }

  for await (const event of subscribtion.value) {
    const message: Message = event.mergeMessageBody.message;
    const fid = message.data?.fid;
    const messageType = message.data?.type;
    if (!fid || !messageType) {
      continue;
    }

    if (messageType === MessageType.CAST_ADD) {
      const data = generateCastData(message);
      if (!data) continue;
      upsertCast(data);
      console.log(
        `[live] [casts] [${fid}] [${data.hash}] processed cast - ${data.castMentions.length} mentions, ${data.castEmbeds.length} embeds, ${data.customEmbeds.length} custom embeds`
      );
    } else if (messageType === MessageType.CAST_REMOVE) {
      const targetHash = message.data?.castRemoveBody?.targetHash;
      if (targetHash) {
        deleteCast(convertToHex(targetHash), fid);
      }
    } else if (messageType === MessageType.REACTION_ADD) {
      const reaction = client.toReaction(message.data);
      if (reaction) {
        await upsertReaction(reaction);
      }
    } else if (messageType === MessageType.REACTION_REMOVE) {
      const reactionData = message.data?.reactionBody;
      if (reactionData?.targetUrl) {
        deleteReaction(reactionData.targetUrl);
      } else if (reactionData?.targetCastId?.hash) {
        deleteReaction(convertToHex(reactionData.targetCastId.hash));
      }
    }
  }
};

const generateCastData = (message?: Message): CastData | undefined => {
  if (!message?.data?.castAddBody) {
    return;
  }

  const fid = message.data.fid;
  const hash = convertToHex(message.hash);

  let parent = undefined;
  let parentFid = undefined;
  let parentType = undefined;

  if (message.data.castAddBody.parentCastId) {
    parent = convertToHex(message.data.castAddBody.parentCastId.hash);
    parentFid = message.data.castAddBody.parentCastId.fid;
    parentType = "cast" as const;
  } else if (message.data.castAddBody.parentUrl) {
    parent = message.data.castAddBody.parentUrl;
    parentType = "url" as const;
  }

  const cast: Cast = {
    hash,
    fid,
    timestamp: new Date(message.data.timestamp * 1000 + FARCASTER_EPOCH),
    parent,
    parentFid,
    parentType,
    text: message.data.castAddBody.text,
  };

  const mentions = message.data.castAddBody.mentions || [];
  const mentionsPositions = message.data.castAddBody.mentionsPositions || [];
  const embeds = message.data.castAddBody.embeds || [];

  const castMentions: CastMention[] = mentions.map((mention, i) => ({
    hash,
    fid,
    mention: mention,
    mentionPosition: mentionsPositions[i],
  }));

  const castEmbeds: CastEmbed[] = embeds.map((embed) => {
    const content =
      (embed.castId ? convertToHex(embed.castId.hash) : embed.url) || "";
    const contentFid = embed.castId ? embed.castId.fid : 0;
    const contentType = embed.castId ? "cast" : "url";
    return {
      hash,
      fid,
      content,
      contentFid,
      contentType,
      parsed: false,
    };
  });

  const customEmbeds: CastEmbed[] = extractLinks(message.data.castAddBody.text)
    .map((url) => ({
      hash,
      fid,
      content: url,
      contentFid: 0,
      contentType: "url" as const,
      parsed: true,
    }))
    .filter(
      (embed) => !castEmbeds.some((e) => e.content.includes(embed.content))
    );

  return {
    fid,
    hash,
    rawHash: message.hash,
    cast,
    castMentions,
    castEmbeds,
    customEmbeds,
  };
};
