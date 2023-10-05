import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { optimism } from "viem/chains";

const FROM_BLOCK = BigInt(108869029);
const KEY_REGISTRY_ADDRESS = "0x00000000fC9e66f1c6d86D750B4af47fF0Cc343d";

const ID_REGISTRY_ADDRESS = "0x00000000FcAf86937e41bA038B4fA40BAA4B780A";

const client = createPublicClient({
  chain: optimism,
  transport: http(process.env.OPTIMISM_RPC_URL as string),
});

type Signer = {
  fid: bigint;
  signer: string;
  timestamp: bigint;
  transactionHash: string;
};

export const GET: RouteHandlerWithSession = ironSessionWrapper(
  async (request, { params }) => {
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

    const fid = BigInt(params.fid as string);
    const [activeKeys, fidAddress] = await Promise.all([
      getActiveSigners(fid),
      getAddressForFid(fid),
    ]);

    const userMap = await getUserMap(
      Object.values(activeKeys).map(({ fid }) => Number(fid))
    );

    return NextResponse.json({
      address: fidAddress,
      ok: fidAddress.toLowerCase() === address.toLowerCase(),
      signers: Object.keys(activeKeys)
        .map((key) => ({
          key,
          timestamp: Number(activeKeys[key].timestamp),
          transactionHash: activeKeys[key].transactionHash,
          user: userMap[Number(activeKeys[key].fid)],
        }))
        .sort((a, b) => b.timestamp - a.timestamp),
    });
  }
);

const getAddressForFid = async (fid: bigint) => {
  const transferLogs = await client.getLogs({
    address: ID_REGISTRY_ADDRESS,
    event: parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 indexed id)"
    ),
    fromBlock: FROM_BLOCK,
    toBlock: "latest",
    args: {
      id: fid,
    },
  });
  if (transferLogs.length > 0) {
    return transferLogs.pop()?.args.to!;
  }

  const registerLogs = await client.getLogs({
    address: ID_REGISTRY_ADDRESS,
    event: parseAbiItem(
      "event Register(address indexed to, uint256 indexed id, address recovery)"
    ),
    fromBlock: FROM_BLOCK,
    toBlock: "latest",
    args: {
      id: fid,
    },
  });
  return registerLogs.pop()?.args.to!;
};

export const getActiveSigners = async (fid: bigint) => {
  const [addedKeys, removedKeys] = await Promise.all([
    getAddedKeys(fid),
    getRemovedKeys(fid),
  ]);

  const activeKeys = Object.keys(addedKeys).reduce((acc, key) => {
    if (removedKeys[key]) return acc;
    return {
      ...acc,
      [key]: addedKeys[key],
    };
  }, {} as Record<string, Signer>);

  return activeKeys;
};

const getAddedKeys = async (fid: bigint) => {
  const logs = await client.getLogs({
    address: KEY_REGISTRY_ADDRESS,
    event: parseAbiItem(
      "event Add(uint256 indexed fid, uint32 indexed keyType, bytes indexed key, bytes keyBytes, uint8 metadataType, bytes metadata)"
    ),
    fromBlock: FROM_BLOCK,
    toBlock: "latest",
    args: {
      fid,
    },
  });

  const decodeSignedKeyRequestMetadata = (data: string) => {
    let offset = 2 + 64;
    const requestFid = BigInt(`0x${data.substr(offset, 64)}`);
    offset += 64;

    const requestSigner = `0x${data.substr(offset, 64).slice(24)}`;
    offset += 64;

    return {
      fid: requestFid,
      signer: requestSigner,
    };
  };

  const blockHashes = logs.map((log) => log.blockHash);
  const blocks = await Promise.all(
    blockHashes.map((blockHash) =>
      client.getBlock({
        blockHash,
      })
    )
  );
  const blockTimes = blocks.reduce((acc, block) => {
    return {
      ...acc,
      [block.hash]: block.timestamp,
    };
  }, {} as Record<string, bigint>);

  return logs.reduce((acc, log) => {
    if (!log.args.metadata || !log.args.keyBytes) return acc;

    const metadata = decodeSignedKeyRequestMetadata(log.args.metadata);

    return {
      ...acc,
      [log.args.keyBytes]: {
        ...metadata,
        timestamp: blockTimes[log.blockHash],
        transactionHash: log.transactionHash,
      },
    };
  }, {} as Record<string, Signer>);
};

const getRemovedKeys = async (fid: bigint) => {
  const logs = await client.getLogs({
    address: KEY_REGISTRY_ADDRESS,
    event: parseAbiItem(
      "event Remove(uint256 indexed fid, bytes indexed key, bytes keyBytes)"
    ),
    fromBlock: FROM_BLOCK,
    toBlock: "latest",
    args: {
      fid,
    },
  });

  return logs.reduce((acc, log) => {
    if (!log.args.keyBytes) return acc;

    return {
      ...acc,
      [log.args.keyBytes]: true,
    };
  }, {} as Record<string, boolean>);
};

const getUserMap = async (fids: number[]) => {
  const users = await prisma.farcaster.findMany({
    where: {
      fid: {
        in: fids,
      },
    },
  });
  const userMap = users.reduce((acc, user) => {
    return {
      ...acc,
      [user.fid]: user,
    };
  }, {} as Record<number, any>);
  return userMap;
};
