import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { mnemonicToAccount } from "viem/accounts";

export const GET: RouteHandlerWithSession = ironSessionWrapper(
  async (request) => {
    const address = request.session.siwe?.data.address;
    if (!address) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        address: address.toLowerCase(),
      },
    });

    if (user?.fid) {
      return NextResponse.json({
        signerUuid: user.signerUuid,
        signerStatus: user.signerStatus,
        signerPublicKey: user.signerPublicKey,
        signerApprovalUrl: user.signerApprovalUrl,
        fid: user.fid,
      });
    }

    let signer;
    if (!user?.signerUuid) {
      const newData = await fetch(
        "https://api.neynar.com/v2/farcaster/signer",
        {
          method: "POST",
          headers: {
            api_key: process.env.NEYNAR_API_KEY as string,
          },
        }
      );
      const newSigner = await newData.json();
      const { signature, appFid, deadline } = await signMessage(
        newSigner.public_key
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
            signer_uuid: newSigner.signer_uuid,
            app_fid: appFid,
            deadline: deadline,
            signature: signature,
          }),
        }
      );
      signer = await data.json();
    } else if (!user?.fid) {
      const data = await fetch(
        `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${user.signerUuid}`,
        {
          method: "GET",
          headers: {
            api_key: process.env.NEYNAR_API_KEY as string,
          },
          cache: "no-store",
        }
      );
      signer = await data.json();
    }

    await prisma.user.upsert({
      where: {
        address: address.toLowerCase(),
      },
      create: {
        address: address.toLowerCase(),
        signerUuid: signer.signer_uuid,
        signerStatus: signer.status,
        signerPublicKey: signer.public_key,
        signerApprovalUrl: signer.signer_approval_url,
        fid: signer.fid,
      },
      update: {
        signerUuid: signer.signer_uuid,
        signerStatus: signer.status,
        signerPublicKey: signer.public_key,
        signerApprovalUrl: signer.signer_approval_url,
        fid: signer.fid,
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
);

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
