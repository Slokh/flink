import { FARCASTER_EPOCH, Message, ReactionType } from "@farcaster/hub-nodejs";
import { convertToHex } from "./hub";

export const generateReactionData = (message: Message) => {
  const messageData = message.data;
  if (!messageData?.reactionBody) {
    return;
  }

  const fid = messageData.fid;
  const timestamp = new Date(messageData.timestamp * 1000 + FARCASTER_EPOCH);
  const reactionBody = messageData.reactionBody;
  if (reactionBody.type === ReactionType.NONE) {
    return;
  }

  const reactionType =
    reactionBody.type === ReactionType.LIKE ? "like" : "recast";

  if (reactionBody?.targetCastId) {
    return {
      fid,
      timestamp,
      targetHash: convertToHex(reactionBody.targetCastId.hash),
      targetFid: reactionBody.targetCastId.fid,
      reactionType,
    };
  } else if (reactionBody?.targetUrl) {
    return {
      fid,
      timestamp,
      targetUrl: reactionBody.targetUrl,
      reactionType,
    };
  }
};
