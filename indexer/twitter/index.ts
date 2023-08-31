import { getTwitterBySource, upsertTwitter } from "../db/twitter";
import { getTwitterFromFriendTech } from "./friendtech";
import { getTwitterFromOpenSea } from "./opensea";
import { getTwitterFromEns } from "./ens";
import { getTwitterFromBio } from "./bio";
import { getTwitterFromNftd } from "./nftd";

export const getTwitterFromAddress = async (
  address: string,
  entityId?: number
) => {
  if (await getTwitterBySource(address)) {
    return;
  }

  const twitter =
    (await getTwitterFromFriendTech(address)) ||
    (await getTwitterFromOpenSea(address)) ||
    (await getTwitterFromEns(address));

  if (!twitter) {
    return;
  }

  await upsertTwitter(twitter, entityId);
  return twitter;
};

export const getTwitterFromRaw = async (raw: string, entityId?: number) => {
  if (await getTwitterBySource(raw)) {
    return;
  }

  const twitter =
    (await getTwitterFromBio(raw)) || (await getTwitterFromNftd(raw));

  if (!twitter) {
    return;
  }

  await upsertTwitter(twitter, entityId);
  return twitter;
};

export const getTwitter = async (
  address: string,
  raw?: string,
  entityId?: number
) => {
  return (
    (await getTwitterFromAddress(address, entityId)) ||
    (raw && (await getTwitterFromRaw(raw, entityId)))
  );
};
