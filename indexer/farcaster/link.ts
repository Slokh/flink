import { FARCASTER_EPOCH, Message } from "@farcaster/hub-nodejs";

export const generateLinkData = (message: Message) => {
  const messageData = message.data;
  if (!messageData?.linkBody?.targetFid) {
    return;
  }

  const fid = messageData.fid;
  const timestamp = new Date(messageData.timestamp * 1000 + FARCASTER_EPOCH);
  const linkData = messageData.linkBody;

  if (!linkData.targetFid) return;

  return {
    fid,
    timestamp,
    linkType: linkData.type,
    targetFid: linkData.targetFid,
    displayTimestamp: linkData.displayTimestamp
      ? new Date(linkData.displayTimestamp * 1000 + FARCASTER_EPOCH)
      : undefined,
  };
};
