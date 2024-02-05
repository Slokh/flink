/* eslint-disable @next/next/no-img-element */
"use client";

import {
	Embed,
	FarcasterUser,
	TransactionToken,
	TransactionTransaction,
} from "../../lib/types";
import { Card } from "../ui/card";
import { Metadata } from "unfurl.js/dist/types";
import {
	decodeFunctionData,
	encodeAbiParameters,
	encodeFunctionData,
	formatEther,
	parseAbiItem,
	parseAbiParameters,
} from "viem";
import {
	useAccount,
	useChainId,
	useContractReads,
	useContractWrite,
	usePrepareContractWrite,
	useSendTransaction,
	useSwitchNetwork,
	useWaitForTransaction,
} from "wagmi";
import { useEffect, useState } from "react";
import { Loading } from "../loading";

const ManifoldMintButton = ({
	address,
	transaction,
	token,
}: {
	address: `0x${string}`;
	transaction: TransactionTransaction;
	token: TransactionToken;
}) => {
	const [hash, setHash] = useState<`0x${string}`>();
	const chainId = useChainId();
	const { switchNetworkAsync } = useSwitchNetwork();

	const decodedCallData = decodeFunctionData({
		abi: [
			parseAbiItem(
				"function mint(address creatorContractAddress, uint256 claimIndex, uint32 mintIndex, bytes32[] calldata merkleProof)",
			),
			parseAbiItem(
				"function mint(address creatorContractAddress, uint256 instanceId, uint32 mintIndex, bytes32[] calldata merkleProof, address mintFor)",
			),
		],
		data: `0x${transaction.callData}`,
	});
	const creatorContractAddress = decodedCallData.args[0];
	const instanceId = decodedCallData.args[1];
	const mintIndex = decodedCallData.args[2];

	const { config: erc721Config, error: erc721Error } = usePrepareContractWrite({
		address: transaction.to as `0x${string}`,
		abi: [
			parseAbiItem(
				"function mint(address creatorContractAddress, uint256 claimIndex, uint32 mintIndex, bytes32[] calldata merkleProof) external payable",
			),
		],
		functionName: "mint",
		args: [creatorContractAddress, instanceId, mintIndex, []],
		value: BigInt(transaction.ethValue),
	});

	const { writeAsync: writeERC721, isLoading: isWriteERC721Loading } =
		useContractWrite(erc721Config);

	const { config: erc1155Config, error: erc1155Error } =
		usePrepareContractWrite({
			address: transaction.to as `0x${string}`,
			abi: [
				parseAbiItem(
					"function mint(address creatorContractAddress, uint256 instanceId, uint32 mintIndex, bytes32[] calldata merkleProof, address mintFor) external payable",
				),
			],
			functionName: "mint",
			args: [creatorContractAddress, instanceId, mintIndex, [], address],
			value: BigInt(transaction.ethValue),
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

	return erc1155Error && erc721Error && token?.chain === chainId ? (
		<div className="border-t bg-border rounded-b-lg text-muted-foreground font-semibold flex justify-center flex-row p-2 text-sm transition-all">
			{erc1155Error.message.includes("insufficient funds") ||
			erc721Error.message.includes("insufficient funds")
				? "Insufficient funds"
				: "Visit link to mint"}
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
				`Mint on ${chainName}${
					transaction
						? ` • ${formatEther(BigInt(transaction.ethValue))} ETH`
						: ""
				}`
			)}
		</div>
	);
};

const ZoraMintButton = ({
	address,
	token,
	referrer,
}: {
	address: `0x${string}`;
	token: TransactionToken;
	referrer: string;
}) => {
	const [hash, setHash] = useState<`0x${string}`>();
	const chainId = useChainId();
	const { switchNetworkAsync } = useSwitchNetwork();

	const saleABI: any = [
		{
			inputs: [
				{
					internalType: "address",
					name: "tokenContract",
					type: "address",
				},
				{
					internalType: "uint256",
					name: "tokenId",
					type: "uint256",
				},
			],
			name: "sale",
			outputs: [
				{
					components: [
						{
							internalType: "uint64",
							name: "saleStart",
							type: "uint64",
						},
						{
							internalType: "uint64",
							name: "saleEnd",
							type: "uint64",
						},
						{
							internalType: "uint64",
							name: "maxTokensPerAddress",
							type: "uint64",
						},
						{
							internalType: "uint96",
							name: "pricePerToken",
							type: "uint96",
						},
						{
							internalType: "address",
							name: "fundsRecipient",
							type: "address",
						},
					],
					internalType: "struct ZoraCreatorFixedPriceSaleStrategy.SalesConfig",
					name: "",
					type: "tuple",
				},
			],
			stateMutability: "view",
			type: "function",
		},
	];

	const { data: prices } = useContractReads({
		contracts: [
			{
				address: "0xff8b0f870ff56870dc5abd6cb3e6e89c8ba2e062",
				abi: saleABI,
				functionName: "sale",
				args: [token.contractAddress, BigInt(token.tokenId)],
			},
			{
				address: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
				abi: saleABI,
				functionName: "sale",
				args: [token.contractAddress, BigInt(token.tokenId)],
			},
		],
	});

	const minter =
		prices?.findIndex(
			// @ts-ignore
			(p) => p.status === "success" && p.result?.saleStart !== BigInt(0),
			// @ts-ignore
		) === 0
			? "0xff8b0f870ff56870dc5abd6cb3e6e89c8ba2e062"
			: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a";
	const price = prices?.find(
		// @ts-ignore
		(p) => p.status === "success" && p.result?.saleStart !== BigInt(0),
		// @ts-ignore
	)?.result?.pricePerToken;

	const { config: erc721Config, error: erc721Error } = usePrepareContractWrite({
		address: token.contractAddress as `0x${string}`,
		abi: [
			parseAbiItem(
				"function mintWithRewards(address minter, uint256 quantity, string calldata comment, address mintReferral) external payable",
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
		value: BigInt("777000000000000") + (price || BigInt(0)),
	});
	const { writeAsync: writeERC721, isLoading: isWriteERC721Loading } =
		useContractWrite(erc721Config);

	const { config: erc1155Config, error: erc1155Error } =
		usePrepareContractWrite({
			address: token.contractAddress as `0x${string}`,
			abi: [
				parseAbiItem(
					"function mintWithRewards(address minter, uint256 tokenId, uint256 quantity, bytes calldata minterArguments, address mintReferral) external payable",
				),
			],
			functionName: "mintWithRewards",
			args: [
				token.chain === 10
					? "0x3678862f04290E565cCA2EF163BAeb92Bb76790C"
					: minter,
				BigInt(token.tokenId),
				BigInt(1),
				encodeAbiParameters(parseAbiParameters("address"), [address]),
				(token.referrer ||
					referrer ||
					"0x0000000000000000000000000000000000000000") as `0x${string}`,
			],
			value: BigInt("777000000000000") + (price || BigInt(0)),
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

	return erc1155Error && erc721Error && token?.chain === chainId ? (
		<div className="border-t bg-border rounded-b-lg text-muted-foreground font-semibold flex justify-center flex-row p-2 text-sm transition-all">
			{erc1155Error.message.includes("insufficient funds") ||
			erc721Error.message.includes("insufficient funds")
				? "Insufficient funds"
				: "Visit link to mint"}
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
					BigInt("777000000000000"),
				)} ETH`}`
			)}
		</div>
	);
};

const MintFunMintButton = ({
	transaction,
	token,
	referrer,
	address,
}: {
	transaction: TransactionTransaction;
	token: TransactionToken;
	referrer: string;
	address: `0x${string}`;
}) => {
	const [hash, setHash] = useState<`0x${string}`>();
	const chainId = useChainId();
	const { switchNetworkAsync } = useSwitchNetwork();

	const decodedCallData = decodeFunctionData({
		abi: [
			parseAbiItem(
				"function mint_efficient_7e80c46e(address _contract, address _to, address _referrer, uint256 _quantity)",
			),
			parseAbiItem(
				"function mint(address _contract, address _to, address _referrer, uint256 _quantity)",
			),
		],
		data: `0x${transaction.callData}`,
	});

	const { config, error } = usePrepareContractWrite({
		address: transaction.to as `0x${string}`,
		abi: [
			parseAbiItem(
				"function mint_efficient_7e80c46e(address _contract, address _to, address _referrer, uint256 _quantity) external payable",
			),
		],
		functionName: "mint_efficient_7e80c46e",
		args: [
			decodedCallData.args[0],
			address,
			(token.referrer ||
				referrer ||
				"0x0000000000000000000000000000000000000000") as `0x${string}`,
			BigInt(1),
		],
		value: BigInt(transaction.ethValue),
	});
	const { writeAsync, isLoading } = useContractWrite(config);

	const { isSuccess, isLoading: isTxLoading } = useWaitForTransaction({
		hash,
	});

	const handleMint = async () => {
		if (switchNetworkAsync && chainId !== token.chain) {
			await switchNetworkAsync(token.chain);
		}
		if (writeAsync) {
			const tx = await writeAsync();
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

	return error && token?.chain === chainId ? (
		<div className="border-t bg-border rounded-b-lg text-muted-foreground font-semibold flex justify-center flex-row p-2 text-sm transition-all">
			{error.message.includes("insufficient funds")
				? "Insufficient funds"
				: "Visit link to mint"}
		</div>
	) : (
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

const DefaultMintButton = ({
	transaction,
	address,
	token,
}: {
	transaction: TransactionTransaction;
	token: TransactionToken;
	address: `0x${string}`;
}) => {
	const [hash, setHash] = useState<`0x${string}`>();
	const chainId = useChainId();
	const { switchNetworkAsync } = useSwitchNetwork();

	const { isLoading, sendTransactionAsync } = useSendTransaction();
	const { isSuccess, isLoading: isTxLoading } = useWaitForTransaction({
		hash,
	});

	let data: `0x${string}` | undefined;
	if (transaction.callData.startsWith("1249c58b0021fb3f")) {
		data = `0x${transaction.callData}`;
	} else if (transaction.callData.startsWith("6a627842")) {
		data = encodeFunctionData({
			abi: [parseAbiItem("function mint(address to)")],
			args: [address],
		});
	}

	const handleMint = async () => {
		if (switchNetworkAsync && chainId !== token.chain) {
			await switchNetworkAsync(token.chain);
		}
		if (sendTransactionAsync && data) {
			const tx = await sendTransactionAsync({
				to: transaction.to,
				value: BigInt(transaction.ethValue),
				data,
			});
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

	if (!data) {
		return (
			<div className="border-t bg-border rounded-b-lg text-muted-foreground font-semibold flex justify-center flex-row p-2 text-sm transition-all">
				Visit link to mint
			</div>
		);
	}

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
	withoutBorder,
	user,
}: {
	embed: Embed;
	withoutBorder?: boolean;
	user: FarcasterUser;
}) => {
	const { address } = useAccount();
	const metadata = embed.contentMetadata as Metadata;
	const {
		token,
		transaction,
		metadata: nftMetadata,
	} = embed.transactionMetadata!;
	const [referrer, setReferrer] = useState(token.referrer);

	useEffect(() => {
		if (referrer) return;
		const fetchReferrer = async () => {
			const response = await fetch(
				`https://fnames.farcaster.xyz/transfers/current?fid=${user?.fid}`,
			);
			const data = await response.json();
			setReferrer(data?.transfer?.owner);
		};
		fetchReferrer();
	}, [user, referrer]);

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
								className={`font-semibold text-sm line-clamp-1 ${
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
			{transaction &&
				address &&
				token &&
				token.platform === "mint.fun" &&
				transaction.to === "0x000000000f30984de6843bbc1d109c95ea6242ac" && (
					<MintFunMintButton
						address={address}
						transaction={transaction}
						token={token}
						referrer={referrer}
					/>
				)}
			{transaction &&
				address &&
				token &&
				token.platform === "mint.fun" &&
				transaction.to !== "0x000000000f30984de6843bbc1d109c95ea6242ac" && (
					<DefaultMintButton
						address={address}
						transaction={transaction}
						token={token}
					/>
				)}
			{transaction && address && token && token.platform === "manifold" && (
				<ManifoldMintButton
					address={address}
					transaction={transaction}
					token={token}
				/>
			)}
			{address && token && token.platform === "zora" && (
				<ZoraMintButton address={address} token={token} referrer={referrer} />
			)}
			{((!transaction && token.platform !== "zora") || !token || !address) && (
				<div className="border-t bg-border rounded-b-lg text-muted-foreground font-semibold flex justify-center flex-row p-2 text-sm transition-all">
					{!address
						? "Log in to mint"
						: !transaction
						  ? "Visit link to mint"
						  : "Visit link to mint"}
				</div>
			)}
		</div>
	);
};
