/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Embed,
  TransactionToken,
  TransactionTransaction,
} from "../../lib/types";
import { EmbedPreviewContent } from "../embeds";
import { Card } from "../ui/card";
import { Metadata } from "unfurl.js/dist/types";
import {
  decodeErrorResult,
  encodeAbiParameters,
  encodeFunctionData,
  formatEther,
  parseAbiItem,
  parseAbiParameters,
  parseEther,
  stringToHex,
} from "viem";
import {
  useAccount,
  useChainId,
  useContractWrite,
  usePrepareContractWrite,
  usePrepareSendTransaction,
  useSendTransaction,
  useSwitchNetwork,
  useWaitForTransaction,
} from "wagmi";
import { useState } from "react";
import { Loading } from "../loading";

const ZoraMintButton = ({
  address,
  token,
}: {
  address: `0x${string}`;
  token: TransactionToken;
}) => {
  const [hash, setHash] = useState<`0x${string}`>();
  const chainId = useChainId();
  const { switchNetworkAsync } = useSwitchNetwork();

  const { config: erc721Config, error: erc721Error } = usePrepareContractWrite({
    address: token.contractAddress as `0x${string}`,
    abi: [
      parseAbiItem(
        "function mintWithRewards(address minter, uint256 quantity, string calldata comment, address mintReferral) external payable"
      ),
    ],
    functionName: "mintWithRewards",
    args: [
      address,
      BigInt(1),
      "",
      (token.referrer ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`,
    ],
    value: BigInt("777000000000000"),
  });
  const { writeAsync: writeERC721, isLoading: isWriteERC721Loading } =
    useContractWrite(erc721Config);

  const { config: erc1155Config, error: erc1155Error } =
    usePrepareContractWrite({
      address: token.contractAddress as `0x${string}`,
      abi: [
        parseAbiItem(
          "function mintWithRewards(address minter, uint256 tokenId, uint256 quantity, bytes calldata minterArguments, address mintReferral) external payable"
        ),
      ],
      functionName: "mintWithRewards",
      args: [
        token.chain === 10
          ? "0x3678862f04290E565cCA2EF163BAeb92Bb76790C"
          : "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
        BigInt(token.tokenId),
        BigInt(1),
        encodeAbiParameters(parseAbiParameters("address"), [address]),
        (token.referrer ||
          "0x0000000000000000000000000000000000000000") as `0x${string}`,
      ],
      value: BigInt("777000000000000"),
    });
  const { writeAsync: writeERC1155, isLoading: isWriteERC1155Loading } =
    useContractWrite(erc1155Config);

  const { isSuccess, isLoading: isTxLoading } = useWaitForTransaction({
    hash,
  });

  const handleMint = async () => {
    if (switchNetworkAsync && chainId !== token.chain) {
      await switchNetworkAsync(token.chain);
    }
    if (token.tokenId && writeERC1155 && !erc1155Error) {
      const tx = await writeERC1155();
      setHash(tx.hash);
    } else if (writeERC721 && !erc721Error) {
      const tx = await writeERC721();
      setHash(tx.hash);
    }
  };

  const chainName =
    token?.chain === 1
      ? "Ethereum"
      : token?.chain === 10
      ? "Optimism"
      : token?.chain === 8453
      ? "Base"
      : token?.chain === 7777777
      ? "Zora"
      : "";

  return erc1155Error && erc721Error ? (
    <div className="border-t bg-border rounded-b-lg text-muted-foreground font-semibold flex justify-center flex-row p-2 text-sm transition-all">
      Not available to mint
    </div>
  ) : (
    <div
      className="border-t bg-foreground rounded-b-lg text-background font-semibold flex justify-center flex-row p-2 text-sm cursor-pointer hover:bg-muted-foreground transition-all"
      onClick={handleMint}
    >
      {isSuccess ? (
        "Successfully minted token"
      ) : isTxLoading || isWriteERC1155Loading || isWriteERC721Loading ? (
        <Loading />
      ) : (
        `Mint on ${chainName}${` • ${formatEther(
          BigInt("777000000000000")
        )} ETH`}`
      )}
    </div>
  );
};

const DefaultMintButton = ({
  transaction,
  token,
}: {
  transaction: TransactionTransaction;
  token: TransactionToken;
}) => {
  const [hash, setHash] = useState<`0x${string}`>();
  const chainId = useChainId();
  const { address } = useAccount();
  const { switchNetworkAsync } = useSwitchNetwork();

  const { isLoading, sendTransactionAsync } = useSendTransaction({
    to: transaction.to,
    value: BigInt(transaction.ethValue),
    data: `0x${transaction.callData}`,
  });
  const { isSuccess, isLoading: isTxLoading } = useWaitForTransaction({
    hash,
  });

  const handleMint = async () => {
    if (switchNetworkAsync && chainId !== token.chain) {
      await switchNetworkAsync(token.chain);
    }
    if (sendTransactionAsync) {
      const tx = await sendTransactionAsync();
      setHash(tx.hash);
    }
  };

  const chainName =
    token?.chain === 1
      ? "Ethereum"
      : token?.chain === 10
      ? "Optimism"
      : token?.chain === 8453
      ? "Base"
      : token?.chain === 7777777
      ? "Zora"
      : "";

  return (
    <div
      className="border-t bg-foreground rounded-b-lg text-background font-semibold flex justify-center flex-row p-2 text-sm cursor-pointer hover:bg-muted-foreground transition-all"
      onClick={handleMint}
    >
      {isSuccess ? (
        "Successfully minted token"
      ) : isLoading || isTxLoading ? (
        <Loading />
      ) : (
        `Mint on ${chainName}${
          transaction
            ? ` • ${formatEther(BigInt(transaction.ethValue))} ETH`
            : ""
        }`
      )}
    </div>
  );
};

export const MintEmbed = ({
  embed,
  text,
  withoutBorder,
}: {
  embed: Embed;
  text?: string;
  withoutBorder?: boolean;
}) => {
  const { address } = useAccount();
  const metadata = embed.contentMetadata as Metadata;
  const {
    token,
    transaction,
    metadata: nftMetadata,
  } = embed.transactionMetadata!;

  if (!address) {
    return <EmbedPreviewContent embed={embed} text={text} />;
  }

  const urlHost =
    (embed.url.startsWith("http")
      ? embed.url.split("/")[2]
      : embed.url.split("/")[0]) || "";
  const image =
    metadata.open_graph?.images?.[0]?.url ||
    metadata.twitter_card?.images?.[0]?.url;

  return (
    <div className="max-w-lg w-full">
      <Card
        className={`${
          withoutBorder ? "border-0" : ""
        } rounded-t-lg rounded-b-none hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-none`}
      >
        <a href={embed.url || "#"} target="_blank" className="">
          <div className="relative">
            <img
              alt="embed_image"
              src={
                nftMetadata?.image_url ||
                nftMetadata?.preview_image_url ||
                image
              }
              className="w-full rounded-t-lg h-[295px] object-cover"
            />
            {!transaction && (
              <div className="absolute inset-0 bg-black opacity-50 rounded-t-lg"></div>
            )}
          </div>
          <div className="flex flex-col p-2 space-y-1">
            <div className="flex flex-row space-x-2 items-center">
              <div
                className={`font-semibold text-sm ${
                  !transaction ? "text-muted-foreground" : ""
                }`}
              >
                {nftMetadata?.name || metadata.title || "No title"}
              </div>
            </div>
            <div className="text-muted-foreground text-xs">{urlHost}</div>
            <div className="text-muted-foreground text-sm line-clamp-1">
              {nftMetadata?.description ||
                metadata.description ||
                "No description."}
            </div>
          </div>
        </a>
      </Card>
      {transaction && token && token.platform !== "zora" && (
        <DefaultMintButton transaction={transaction} token={token} />
      )}
      {transaction && token && token.platform === "zora" && (
        <ZoraMintButton address={address} token={token} />
      )}
      {(!transaction || !token) && (
        <div className="border-t bg-border rounded-b-lg text-muted-foreground font-semibold flex justify-center flex-row p-2 text-sm transition-all">
          Not available to mint
        </div>
      )}
    </div>
  );
};
