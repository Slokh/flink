import { CHAIN_ID_TO_NAME } from "@/indexer/util";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = decodeURIComponent(params.id);
  if (!id.startsWith("chain://")) {
    return NextResponse.json({ members: [] });
  }

  const parts = id.split("/");
  const chainId = parts[2];
  const chain = CHAIN_ID_TO_NAME[chainId];
  const contractAddress = parts[3].split(":")[1];

  let existingCollection = await prisma.ethereumNftContract.findUnique({
    where: {
      chainId_contractAddress: {
        chainId: chainId,
        contractAddress: contractAddress,
      },
    },
  });

  if (!existingCollection) {
    const collections = await makePaginatedRequest(
      `/collections/${chain}/${contractAddress}`,
      "collections"
    );
    if (collections.length === 0) {
      return NextResponse.json({ members: [] });
    }

    const quantity = collections.reduce(
      (acc: number, collection: any) => acc + collection.total_quantity,
      0
    );
    existingCollection = await prisma.ethereumNftContract.create({
      data: {
        chainId,
        contractAddress,
        quantity,
        metadata: {
          name: collections[0].name,
          description: collections[0].description,
          image: collections[0].image_url,
          banner: collections[0].banner_image_url,
          externalUrl: collections[0].external_url,
          twitterUrl: collections[0].twitter_username,
          discordUrl: collections[0].discord_url,
          openseaUrl: collections[0].marketplace_pages.find(
            ({ marketplace_id }: any) => marketplace_id === "opensea"
          )?.collection_url,
        },
      },
    });
  }

  return NextResponse.json({
    collection: existingCollection,
  });
}

const makePaginatedRequest = async (
  path: string,
  key: string,
  cursor?: string
): Promise<any[]> => {
  const data = await makeRequest(`${path}${cursor ? `?cursor=${cursor}` : ""}`);

  if (data.next_cursor) {
    const nextPageData = await makePaginatedRequest(
      path,
      key,
      data.next_cursor
    );
    return [...data[key], ...nextPageData];
  } else {
    return data[key];
  }
};

const makeRequest = async (path: string) => {
  const response = await fetch(
    `https://api.simplehash.com/api/v0/nfts${path}`,
    {
      headers: {
        "X-API-KEY": process.env.SIMPLEHASH_API_KEY as string,
      },
    }
  );

  return await response.json();
};
