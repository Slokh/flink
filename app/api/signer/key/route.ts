import { signerUuid } from "@/context/user";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { mnemonicToAccount } from "viem/accounts";

export async function POST(
  request: Request
): Promise<NextResponse<SignerState>> {
  const body = await request.json();

  const { signature, appFid, deadline } = await signMessage(
    body.signerPublicKey
  );

  const data = await fetch(
    "https://api.neynar.com/v2/farcaster/signer/signed_key",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.NEYNAR_API_KEY as string,
      },
      body: JSON.stringify({
        signer_uuid: body.signerUuid,
        app_fid: appFid,
        deadline: deadline,
        signature: signature,
      }),
    }
  );

  const signer = await data.json();

  await prisma.user.upsert({
    where: {
      address: body.address,
    },
    create: {
      address: body.address,
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
  });
}

const signMessage = async (publicKey: `0x${string}`) => {
  const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
    name: "Farcaster SignedKeyRequestValidator",
    version: "1",
    chainId: 10,
    verifyingContract:
      "0x00000000fc700472606ed4fa22623acf62c60553" as `0x${string}`,
  };

  const SIGNED_KEY_REQUEST_TYPE = [
    { name: "requestFid", type: "uint256" },
    { name: "key", type: "bytes" },
    { name: "deadline", type: "uint256" },
  ];

  const appFid = process.env.APP_FID as string;
  const account = mnemonicToAccount(process.env.APP_MNENOMIC as string);

  const deadline = Math.floor(Date.now() / 1000) + 86400;
  const signature = await account.signTypedData({
    domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
    },
    primaryType: "SignedKeyRequest",
    message: {
      requestFid: BigInt(appFid),
      key: publicKey,
      deadline: BigInt(deadline),
    },
  });

  return {
    signature,
    appFid,
    deadline,
  };
};
