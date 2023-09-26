import { SignerState } from "@/context/user";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse<SignerState>> {
  const data = await fetch("https://api.neynar.com/v2/farcaster/signer", {
    method: "POST",
    headers: {
      api_key: process.env.NEYNAR_API_KEY as string,
    },
  });

  const signer = await data.json();

  return NextResponse.json({
    signerUuid: signer.signer_uuid,
    signerStatus: signer.status,
    signerPublicKey: signer.public_key,
  });
}
