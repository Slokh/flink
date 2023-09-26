import { headers } from "next/headers";
import { ChannelStats, Entity, FarcasterCastTree } from "./types";

export const getEntity = async (
  id: string,
  create: boolean
): Promise<Entity> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/users/${id}${create ? "?create=true" : ""}`
  );
  return await data.json();
};

export const getCast = async (
  cast: string
): Promise<FarcasterCastTree | undefined> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(`${protocol}://${host}/api/casts/${cast}`);
  if (data.status === 404) return undefined;
  return await data.json();
};

export const getChannelEngagementStats = async (
  time: string
): Promise<ChannelStats[]> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/stats/channels/engagement${
      time ? `?time=${time}` : ""
    }`
  );
  return await data.json();
};

export const getChannelStats = async (channel: string) => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/stats/channels/${channel}`
  );
  return await data.json();
};
