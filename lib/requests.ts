import { headers } from "next/headers";
import { Entity, FarcasterCastTree } from "./types";

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
