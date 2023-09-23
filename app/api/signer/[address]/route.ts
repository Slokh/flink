import { signerUuid } from "@/context/user";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
): Promise<NextResponse<SignerState | {}>> {
  const data = await prisma.user.findFirst({
    where: {
      address: params.address,
    },
  });

  if (!data?.signerUuid) {
    return NextResponse.json({}, { status: 404 });
  }

  return NextResponse.json({
    signerUuid: data.signerUuid,
    signerStatus: data.signerStatus,
    signerPublicKey: data.signerPublicKey,
    signerApprovalUrl: data.signerApprovalUrl,
    fid: data.fid,
  });
}
