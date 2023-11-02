import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { poll: string } }
) {
  const pollId = parseInt(params.poll);

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
  });
  if (!poll?.hash) {
    return NextResponse.json({}, { status: 404 });
  }

  const casts = await prisma.farcasterCast.findMany({
    where: { topParentCast: poll?.hash },
    orderBy: { timestamp: "asc" },
  });

  const castForFid = casts.reduce((acc, cast) => {
    acc[cast.fid] = cast.text;
    return acc;
  }, {} as Record<number, string>);

  const relevantCasts = Object.values(castForFid);

  const votes = relevantCasts
    .filter((cast) => /^\d/.test(cast))
    .map((cast) => {
      const match = cast.match(/\d+/);
      return match ? parseInt(match[0]) : undefined;
    })
    .filter(Boolean) as number[];

  const options = poll.options as string[];
  const results = options.map((option, i) => {
    return {
      option,
      votes: votes.filter((vote) => vote === i + 1).length,
    };
  });

  return NextResponse.json({
    hash: poll.hash,
    prompt: poll.prompt,
    results,
  });
}
