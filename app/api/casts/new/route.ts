import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const data = await fetch("https://api.neynar.com/v2/farcaster/cast", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      api_key: process.env.NEYNAR_API_KEY as string,
    },
    body: JSON.stringify(await request.json()),
  });

  if (!data.ok) {
    return NextResponse.json({
      status: data.status,
      statusText: data.statusText,
      error: await data.json(),
    });
  }

  console.log(await data.json());

  return NextResponse.json({});
}
