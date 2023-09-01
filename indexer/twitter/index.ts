import { getTwitterBySource, upsertTwitter } from "../db/twitter";
import { getTwitterFromFriendTech } from "./friendtech";
import { getTwitterFromEns } from "./ens";
import { getTwitterFromLink } from "./link";
import { getTwitterFromNftd } from "./nftd";

export const getTwitterFromAddress = async (
  entityId: number,
  address: string
) => {
  if (await getTwitterBySource(address)) {
    return;
  }

  const twitter =
    (await getTwitterFromFriendTech(address)) ||
    (await getTwitterFromEns(address));

  if (!twitter) {
    return;
  }
  await upsertTwitter(twitter, entityId);
  return twitter;
};

export const getTwitterFromURL = async (entityId: number, link: string) => {
  if (await getTwitterBySource(link)) {
    return;
  }

  const twitter =
    (await getTwitterFromLink(link)) || (await getTwitterFromNftd(link));

  if (!twitter) {
    return;
  }

  await upsertTwitter(twitter, entityId);
  return twitter;
};
