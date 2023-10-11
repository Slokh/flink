import { CONTRACTS } from "@/lib/contracts";
import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

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

    const existingSigner = await prisma.user.findFirst({
      where: {
        address: address.toLowerCase(),
        signerStatus: "pending_approval",
      },
    });
    if (existingSigner) {
      return NextResponse.json({
        signerUuid: existingSigner.signerUuid,
        signerStatus: existingSigner.signerStatus,
        signerPublicKey: existingSigner.signerPublicKey,
        signerApprovalUrl: existingSigner.signerApprovalUrl,
      });
    }

    const newData = await fetch("https://api.neynar.com/v2/farcaster/signer", {
      method: "POST",
      headers: {
        api_key: process.env.NEYNAR_API_KEY as string,
      },
    });
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

    const signer = await data.json();

    await prisma.user.create({
      data: {
        address: address.toLowerCase(),
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
);

const signMessage = async (publicKey: `0x${string}`) => {
  const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
    name: "Farcaster SignedKeyRequestValidator",
    version: "1",
    chainId: CONTRACTS.NETWORK,
    verifyingContract: CONTRACTS.VALIDATOR_ADDRESS,
  };

  const SIGNED_KEY_REQUEST_TYPE = [
    { name: "requestFid", type: "uint256" },
    { name: "key", type: "bytes" },
    { name: "deadline", type: "uint256" },
  ];

  const appFid = process.env.APP_FID as string;
  const account = privateKeyToAccount(
    process.env.APP_PRIVATE_KEY as `0x${string}`
  );

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
