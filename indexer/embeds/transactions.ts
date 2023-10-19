import { createPublicClient, http, isAddress } from "viem";
import { CHAIN_ID_TO_NAME, NAME_TO_CHAIN_ID } from "../util";
import { base, mainnet, optimism, zora } from "viem/chains";
import { getNftMetadata } from "./nft";

const MANIFOLD_ER1155_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "creatorContractAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "instanceId",
        type: "uint256",
      },
    ],
    name: "getClaim",
    outputs: [
      {
        components: [
          {
            internalType: "uint32",
            name: "total",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "totalMax",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "walletMax",
            type: "uint32",
          },
          {
            internalType: "uint48",
            name: "startDate",
            type: "uint48",
          },
          {
            internalType: "uint48",
            name: "endDate",
            type: "uint48",
          },
          {
            internalType: "enum ILazyPayableClaim.StorageProtocol",
            name: "storageProtocol",
            type: "uint8",
          },
          {
            internalType: "bytes32",
            name: "merkleRoot",
            type: "bytes32",
          },
          {
            internalType: "string",
            name: "location",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "cost",
            type: "uint256",
          },
          {
            internalType: "address payable",
            name: "paymentReceiver",
            type: "address",
          },
          {
            internalType: "address",
            name: "erc20",
            type: "address",
          },
        ],
        internalType: "struct IERC1155LazyPayableClaim.Claim",
        name: "claim",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

type IToken = {
  chain: number;
  contractAddress: string;
  tokenId?: string;
};

const extractTokenFromManifold = async (url: string) => {
  const slug = url.split("?")[0].split("app.manifold.xyz/c/")[1];
  const response = await fetch(
    `https://apps.api.manifoldxyz.dev/public/instance/data?instanceSlug=${slug}&appId=2537426615`
  );
  if (!response.ok) return;
  const data = await response.json();

  const chain = data.publicData.network;
  const contractAddress = data.publicData.creatorContractAddress;
  let tokenId;

  if (data.publicData.claimType.toLowerCase() === "erc1155") {
    const extensionAddress = data.publicData.extensionAddress;
    const client = getClient(chain);
    const claim = (await client.readContract({
      address: extensionAddress,
      abi: MANIFOLD_ER1155_ABI,
      functionName: "getClaim",
      args: [contractAddress, data.publicData.claimIndex],
    })) as { tokenId: string };
    tokenId = claim.tokenId?.toString();
  }

  return {
    chain,
    contractAddress,
    tokenId,
    platform: "manifold",
  };
};

const extractTokenFromZora = async (url: string) => {
  if (url.includes("testnet")) return;

  let referrer;
  const [zora, maybeQuery] = url.split("?");
  if (maybeQuery) {
    const [_, maybeReferrer] = maybeQuery.split("referrer=");
    referrer = maybeReferrer;
  }

  const path = zora.split("zora.co/collect/")[1];
  const [chainAndContract, tokenId] = path.split("/");

  let chain;
  let contractAddress;

  if (chainAndContract.includes(":")) {
    const [chainName, address] = chainAndContract.split(":");
    if (!isNaN(parseInt(chainName))) {
      chain = parseInt(chainName);
    } else {
      const chainId = NAME_TO_CHAIN_ID[chainName];
      if (!chainId) return;
      chain =
        chainName === "eth"
          ? 1
          : chainName === "oeth"
          ? 10
          : parseInt(chainId.split(":")[1]);
    }
    contractAddress = address;
  } else {
    contractAddress = chainAndContract;
    chain = 1;
  }

  return {
    chain,
    contractAddress,
    tokenId: !isNaN(parseInt(tokenId)) ? tokenId : undefined,
    referrer,
    platform: "zora",
  };
};

const extractTokenFromMintFun = async (url: string) => {
  let referrer;
  const [mintFun, maybeQuery] = url.split("?");
  if (maybeQuery) {
    const [_, maybeReferrer] = maybeQuery.split("ref=");
    referrer = maybeReferrer;
  }

  const path = mintFun.split("mint.fun/")[1];
  if (!path) return;

  const [chainName, address] = path.split("/");

  let chain;
  let contractAddress;

  if (chainName && isAddress(chainName)) {
    contractAddress = chainName;
    chain = 1;
  } else if (address && isAddress(address)) {
    contractAddress = address;
    const chainId = NAME_TO_CHAIN_ID[chainName];
    if (!chainId) return;
    chain = chainName === "op" ? 10 : parseInt(chainId.split(":")[1]);
  } else {
    return;
  }

  return {
    chain,
    contractAddress,
    referrer,
    platform: "mint.fun",
  };
};

export const getTransactionMetadata = async (url: string) => {
  let token: IToken | undefined;
  if (url.includes("app.manifold.xyz/c/")) {
    token = await extractTokenFromManifold(url);
  } else if (url.includes("zora.co/collect/")) {
    token = await extractTokenFromZora(url);
  } else if (url.includes("mint.fun")) {
    token = await extractTokenFromMintFun(url);
  } else {
    return;
  }

  if (!token || !isAddress(token.contractAddress)) return;

  const transaction = await getTransactionFromMintFun(token);
  if (!token.tokenId) {
    token.tokenId = transaction?.tokenId ? transaction.tokenId : "1";
  }

  const metadata = await getNftMetadata(
    CHAIN_ID_TO_NAME[`eip155:${token.chain}`],
    token.contractAddress,
    token.tokenId || "1"
  );

  if (!metadata || Object.keys(metadata).length === 0) return { token };

  return {
    token,
    metadata: {
      name: metadata.name,
      description: metadata.description,
      image_url: metadata.image_url,
      preview_image_url: metadata.previews.image_medium_url,
      video_url: metadata.video_url,
      audio_url: metadata.audio_url,
      model_url: metadata.model_url,
      other_url: metadata.other_url,
      external_url: metadata.external_url,
      contract: {
        name: metadata.contract.name,
        symbol: metadata.contract.symbol,
        type: metadata.contract.type,
        owned_by: metadata.contract.owned_by,
        deployed_by: metadata.contract.deployed_by,
      },
      collection: {
        name: metadata.collection.name,
        description: metadata.collection.description,
        image_url: metadata.collection.image_url,
      },
      openseaUrl: metadata.collection.marketplace_pages.find(
        ({ marketplace_id }: any) => marketplace_id === "opensea"
      )?.collection_url,
    },
    transaction,
  };
};

const getClient = (input: string | number) => {
  let chain;
  let transport;
  switch (input) {
    case "ethereum":
    case 1:
      chain = mainnet;
      transport = http(process.env.ETH_RPC_ENDPOINT);
      break;
    case "optimism":
    case 10:
      chain = optimism;
      transport = http(process.env.OPTIMISM_RPC_URL);
      break;
    case "zora":
    case 7777777:
      chain = zora;
      transport = http("https://rpc.zora.energy");
      break;
    case "base":
    case 8453:
      chain = base;
      transport = http("https://mainnet.base.org");
      break;
  }

  if (!chain || !transport) {
    throw new Error(`Invalid chain: ${input}`);
  }

  return createPublicClient({
    chain,
    transport,
  });
};

const getTransactionFromMintFun = async (token: IToken) => {
  const response = await fetch(
    `https://mint.fun/api/mintfun/contract/${token.chain}:${token.contractAddress}/transactions`
  );
  const { transactions } = await response.json();
  const orderedTransactions = transactions.sort(
    (a: any, b: any) =>
      new Date(b.latestBlockTimestamp).getTime() -
      new Date(a.latestBlockTimestamp).getTime()
  );
  const validTransactions = orderedTransactions.filter(
    (tx: any) =>
      tx.isValid &&
      !tx.isAllowlist &&
      tx.nftCount === "1" &&
      (!token.tokenId || tx.tokenId === token.tokenId)
  );

  if (validTransactions.length === 0) return;
  const { callData, nftCount, tokenId, ethValue, to } = validTransactions[0];
  return {
    callData,
    tokenId,
    nftCount,
    ethValue,
    to,
  };
};
