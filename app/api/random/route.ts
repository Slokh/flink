import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Entity } from "@/lib/types";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const maxEntityId = await prisma.farcaster.findFirst({
    orderBy: { entityId: "desc" },
    select: { entityId: true },
  });

  if (!maxEntityId?.entityId) {
    return NextResponse.json(
      { error: "Error getting random users" },
      { status: 500 }
    );
  }

  const randomEntityIds = Array.from(
    { length: 50 },
    () => Math.floor(Math.random() * maxEntityId?.entityId) + 1
  );

  const randomEntities = await prisma.entity.findMany({
    where: { id: { in: randomEntityIds }, links: { some: {} } },
    select: {
      farcasterAccounts: true,
    },
  });

  if (!randomEntities) {
    return NextResponse.json(
      { error: "Error getting random users" },
      { status: 500 }
    );
  }

  const fnames = randomEntities.map(
    (entity) => entity.farcasterAccounts[0].fname
  );

  const entities = await Promise.all(
    fnames.map(async (fname) => {
      const host = headers().get("host");
      const protocol =
        process?.env.NODE_ENV === "development" ? "http" : "https";
      return await (
        await fetch(`${protocol}://${host}/api/users/${fname}`)
      ).json();
    })
  );

  const selectedEntities = entities
    .filter(({ accounts }: Entity) => accounts.length > 1)
    .slice(0, 12);

  return NextResponse.json(selectedEntities);
}
