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

    const data = await fetch("https://api.neynar.com/v2/farcaster/signer", {
      method: "POST",
      headers: {
        api_key: process.env.NEYNAR_API_KEY as string,
      },
    });
    const signer = await data.json();
    const { signature, appFid, deadline, appAddress } = await signMessage(
      signer.public_key
    );

    await prisma.user.create({
      data: {
        address: address.toLowerCase(),
        signerUuid: signer.signer_uuid,
        signerStatus: signer.status,
        signerPublicKey: signer.public_key,
      },
    });

    return NextResponse.json({
      signerUuid: signer.signer_uuid,
      signerStatus: signer.status,
      signerPublicKey: signer.public_key,
      signature,
      appFid,
      deadline,
      address: appAddress,
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
    appAddress: account.address,
  };
};
