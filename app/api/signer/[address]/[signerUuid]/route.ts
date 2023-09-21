import { SignerState } from "@/context/user";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { signerUuid: string; address: string } }
): Promise<NextResponse<SignerState | {}>> {
  const { signerUuid, address } = params;

  const data = await fetch(
    `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signerUuid}`,
    {
      method: "GET",
      headers: {
        api_key: process.env.NEYNAR_API_KEY as string,
      },
    }
  );

  const signer = await data.json();

  if (signer.status !== "approved") {
    return NextResponse.json({}, { status: 404 });
  }

  await prisma.user.upsert({
    where: {
      address,
    },
    create: {
      address,
      signerUuid: signer.signer_uuid,
      signerStatus: signer.status,
      signerPublicKey: signer.public_key,
      signerApprovalUrl: signer.signer_approval_url,
    },
    update: {
      signerUuid: signer.signer_uuid,
      signerStatus: signer.status,
      signerPublicKey: signer.public_key,
      signerApprovalUrl: signer.signer_approval_url,
    },
  });

  return NextResponse.json({
    signerUuid: signer.signer_uuid,
    signerStatus: signer.status,
    signerPublicKey: signer.public_key,
    signerApprovalUrl: signer.signer_approval_url,
    fid: signer.fid,
  });
}
