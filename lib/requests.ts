import { headers } from "next/headers";
import {
  CastsSort,
  ChannelStats,
  Entity,
  FarcasterCast,
  FarcasterCastTree,
  FollowersStats,
  LinkStats,
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
  fid?: number,
  all?: boolean,
  url?: string,
  query?: string
): Promise<FarcasterCast[]> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/casts?sort=${sort}${
      parentUrl ? `&parentUrl=${parentUrl}` : ""
    }${time ? `&time=${time}` : ""}${fid ? `&fid=${fid}` : ""}${
      page ? `&page=${page}` : ""
    }${all ? `&all=true` : ""}${url ? `&url=${encodeURI(url)}` : ""}${
      query ? `&query=${query}` : ""
    }`
  );
  return await data.json();
};

export const getUserEngagementStats = async (
  time: string,
  query?: string
): Promise<UserStats[]> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/stats/users/engagement${
      time ? `?time=${time}` : ""
    }${query ? `&query=${query}` : ""}`
  );
  return await data.json();
};

export const getLinkEngagementStats = async (
  time: string
): Promise<LinkStats[]> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(
    `${protocol}://${host}/api/stats/links/engagement${
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

export const getChannelMembers = async (url: string) => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(`${protocol}://${host}/api/channels/${url}/members`);
  return await data.json();
};

export const getUserFollowers = async (
  fid: number
): Promise<{ followers: FollowersStats[] }> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(`${protocol}://${host}/api/stats/followers/${fid}`);
  return await data.json();
};

export const getUserFollowing = async (
  fid: number
): Promise<{ following: FollowersStats[] }> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await fetch(`${protocol}://${host}/api/stats/following/${fid}`);
  return await data.json();
};
