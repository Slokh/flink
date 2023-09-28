import { headers } from "next/headers";
import {
  CastsSort,
  ChannelStats,
  Entity,
  FarcasterCast,
  FarcasterCastTree,
  UserStats,
} from "./types";

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

export const getChannelStats = async (channel: string, time?: string) => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/stats/channels/${channel}${
      time ? `?time=${time}` : ""
    }`
  );
  return await data.json();
};

export const getCasts = async (
  sort: CastsSort,
  page: number,
  parentUrl?: string,
  time?: string,
  fid?: number
): Promise<FarcasterCast[]> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/casts?sort=${sort}${
      parentUrl ? `&parentUrl=${parentUrl}` : ""
    }${time ? `&time=${time}` : ""}${fid ? `&fid=${fid}` : ""}${
      page ? `&page=${page}` : ""
    }`
  );
  return await data.json();
};

export const getUserEngagementStats = async (
  time: string
): Promise<UserStats[]> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/stats/users/engagement${
      time ? `?time=${time}` : ""
    }`
  );
  return await data.json();
};

export const getUserStats = async (fid: number, time?: string) => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/stats/users/${fid}${time ? `?time=${time}` : ""}`
  );
  return await data.json();
};
