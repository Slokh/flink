import { CHAIN_ID_TO_NAME } from "@/indexer/util";
import prisma from "@/lib/prisma";
import { FarcasterUser } from "@/lib/types";
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
  const tokenId = parts.length > 4 ? parts[4] : undefined;

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

  const members = tokenId
    ? await getMembersForToken(chainId, contractAddress, tokenId)
    : await getMembersForContract(
        chainId,
        contractAddress,
        existingCollection.lastUpdatedAt
      );

  const addresses = members.map((member) => member.ownerAddress.toLowerCase());
  const entities = await prisma.entity.findMany({
    where: {
      ethereumAccounts: {
        some: {
          address: {
            in: addresses,
          },
          verified: true,
        },
      },
    },
    select: {
      ethereumAccounts: true,
      farcasterAccounts: true,
    },
  });
  const userMap = entities.reduce((acc, cur) => {
    cur.ethereumAccounts.forEach((account) => {
      cur.farcasterAccounts.forEach((farcasterAccount) => {
        acc[account.address] = {
          fid: farcasterAccount.fid,
          fname: farcasterAccount.fname || undefined,
          pfp: farcasterAccount.pfp || undefined,
          bio: farcasterAccount.bio || undefined,
          display: farcasterAccount.display || undefined,
        };
      });
    });
    return acc;
  }, {} as Record<string, FarcasterUser>);

  const fids = Object.values(userMap).map((account) => account.fid);
  const [followers, recentActivity, allActivity] = await Promise.all([
    prisma.farcasterLink.groupBy({
      by: ["targetFid"],
      where: {
        linkType: "follow",
        deleted: false,
        targetFid: {
          in: fids,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.farcasterUserStats.groupBy({
      by: ["fid"],
      _sum: {
        likes: true,
        recasts: true,
        replies: true,
        posts: true,
        liked: true,
        recasted: true,
        mentions: true,
      },
      where: {
        timestamp: {
          gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        fid: {
          in: fids,
        },
        url: id,
      },
    }),
    prisma.farcasterUserStats.groupBy({
      by: ["fid"],
      _sum: {
        likes: true,
        recasts: true,
        replies: true,
        posts: true,
        liked: true,
        recasted: true,
        mentions: true,
      },
      where: {
        fid: {
          in: fids,
        },
        url: id,
      },
    }),
  ]);

  const followerMap = followers.reduce((acc, cur) => {
    acc[cur.targetFid] = cur._count._all;
    return acc;
  }, {} as Record<string, number>);

  const recentActivityMap = recentActivity.reduce((acc, cur) => {
    const posts = cur._sum.posts || 0;
    const replies = cur._sum.replies || 0;
    const liked = cur._sum.liked || 0;
    const recasted = cur._sum.recasted || 0;
    acc[cur.fid] = {
      ...cur._sum,
      engagement: posts + 0.5 * replies + 0.25 * liked + 0.25 * recasted,
    };
    return acc;
  }, {} as Record<string, any>);

  const allActivityMap = allActivity.reduce((acc, cur) => {
    const posts = cur._sum.posts || 0;
    const replies = cur._sum.replies || 0;
    const liked = cur._sum.liked || 0;
    const recasted = cur._sum.recasted || 0;
    acc[cur.fid] = {
      ...cur._sum,
      engagement: posts + 0.5 * replies + 0.25 * liked + 0.25 * recasted,
    };
    return acc;
  }, {} as Record<string, any>);

  return NextResponse.json({
    members: members
      .map((member) => {
        const user = userMap[member.ownerAddress.toLowerCase()];
        if (!user) {
          return undefined;
          // return {
          //   collection: existingCollection?.metadata,
          //   token: {
          //     ...member.nft,
          //     ownerAddress: member.ownerAddress,
          //     quantity: member.quantity,
          //     firstAcquiredAt: member.firstAcquiredAt,
          //     lastAcquiredAt: member.lastAcquiredAt,
          //   },
          // };
        }

        const fid = user.fid;
        return {
          collection: {
            // @ts-ignore
            name: existingCollection?.metadata?.name,
            quantity: existingCollection?.quantity,
          },
          token: {
            ...member.nft,
            ownerAddress: member.ownerAddress,
            quantity: member.quantity,
            firstAcquiredAt: member.firstAcquiredAt,
            lastAcquiredAt: member.lastAcquiredAt,
          },
          user,
          followers: followerMap[fid] || 0,
          recentActivity: recentActivityMap[fid] || {
            likes: 0,
            recasts: 0,
            replies: 0,
            posts: 0,
            liked: 0,
            recasted: 0,
            mentions: 0,
            engagement: 0,
          },
          allActivity: allActivityMap[fid] || {
            likes: 0,
            recasts: 0,
            replies: 0,
            posts: 0,
            liked: 0,
            recasted: 0,
            mentions: 0,
            engagement: 0,
          },
        };
      })
      .filter(Boolean),
  });
}

const getMembersForToken = async (
  chainId: string,
  contractAddress: string,
  tokenId: string
) => {
  const chain = CHAIN_ID_TO_NAME[chainId];
  let existingToken = await prisma.ethereumNft.findUnique({
    where: {
      chainId_contractAddress_tokenId: {
        chainId,
        contractAddress,
        tokenId,
      },
    },
  });

  if (!existingToken) {
    const nft = await makeRequest(`/${chain}/${contractAddress}/${tokenId}`);
    existingToken = await prisma.ethereumNft.create({
      data: {
        chainId,
        contractAddress,
        tokenId,
        quantity: nft.token_count,
        metadata: {
          name: nft.name,
          description: nft.description,
          image: nft.previews.image_medium_url,
          externalUrl: nft.external_url,
          banner: nft.collection.banner_image_url,
          twitterUrl: nft.collection.twitter_username,
          discordUrl: nft.collection.discord_url,
          openseaUrl: nft.collection.marketplace_pages.find(
            ({ marketplace_id }: any) => marketplace_id === "opensea"
          )?.nft_url,
        },
        createdAt: new Date(nft.created_date),
      },
    });
  }

  if (
    !existingToken.lastUpdatedAt ||
    existingToken.lastUpdatedAt < new Date(Date.now() - 1000 * 60 * 60 * 24)
  ) {
    const owners = await makePaginatedRequest(
      `/owners/${chain}/${contractAddress}/${tokenId}`,
      "owners"
    );

    const batchSize = 5000;
    for (let i = 0; i < owners.length; i += batchSize) {
      const batch = owners.slice(i, i + batchSize);
      await prisma.ethereumNftOwner.deleteMany({
        where: {
          chainId,
          contractAddress,
          tokenId,
          ownerAddress: {
            in: batch.map((owner: any) => owner.owner_address),
          },
        },
      });
      await prisma.ethereumNftOwner.createMany({
        data: batch.map((owner: any) => ({
          chainId,
          contractAddress,
          tokenId,
          ownerAddress: owner.owner_address,
          quantity: owner.quantity,
          firstAcquiredAt: new Date(owner.first_acquired_date),
          lastAcquiredAt: new Date(owner.last_acquired_date),
        })),
        skipDuplicates: true,
      });
    }

    await prisma.ethereumNft.update({
      where: {
        chainId_contractAddress_tokenId: {
          chainId,
          contractAddress,
          tokenId,
        },
      },
      data: {
        quantity: owners.reduce(
          (acc: number, owner: any) => acc + owner.quantity,
          0
        ),
        lastUpdatedAt: new Date(),
      },
    });
  }

  return await prisma.ethereumNftOwner.findMany({
    where: {
      contractAddress,
      tokenId,
    },
    include: {
      nft: true,
    },
  });
};

const getMembersForContract = async (
  chainId: string,
  contractAddress: string,
  lastUpdatedAt: Date | null
) => {
  const chain = CHAIN_ID_TO_NAME[chainId];
  if (
    !lastUpdatedAt ||
    lastUpdatedAt < new Date(Date.now() - 1000 * 60 * 60 * 24)
  ) {
    const nfts = await makePaginatedRequest(
      `/${chain}/${contractAddress}`,
      "nfts"
    );

    const batchSize = 5000;
    for (let i = 0; i < nfts.length; i += batchSize) {
      const batch = nfts.slice(i, i + batchSize);
      await prisma.ethereumNftOwner.deleteMany({
        where: {
          chainId,
          contractAddress,
          tokenId: {
            in: batch.map((nft: any) => nft.token_id),
          },
        },
      });
      await prisma.ethereumNft.deleteMany({
        where: {
          chainId,
          contractAddress,
          tokenId: {
            in: batch.map((nft: any) => nft.token_id),
          },
        },
      });
      await prisma.ethereumNft.createMany({
        data: batch.map((nft: any) => ({
          chainId,
          contractAddress,
          tokenId: nft.token_id,
          quantity: nft.token_count,
          metadata: {
            name: nft.name,
            description: nft.description,
            image: nft.previews.image_medium_url,
            externalUrl: nft.external_url,
            banner: nft.collection.banner_image_url,
            twitterUrl: nft.collection.twitter_username,
            discordUrl: nft.collection.discord_url,
            openseaUrl: nft.collection.marketplace_pages.find(
              ({ marketplace_id }: any) => marketplace_id === "opensea"
            )?.nft_url,
          },
          createdAt: new Date(nft.created_date),
        })),
        skipDuplicates: true,
      });
      await prisma.ethereumNftOwner.createMany({
        data: batch.map((nft: any) => ({
          chainId,
          contractAddress,
          tokenId: nft.token_id,
          ownerAddress: nft.owners[0].owner_address,
          quantity: nft.owners[0].quantity,
          firstAcquiredAt: new Date(nft.owners[0].first_acquired_date),
          lastAcquiredAt: new Date(nft.owners[0].last_acquired_date),
        })),
        skipDuplicates: true,
      });
    }

    await prisma.ethereumNftContract.update({
      where: {
        chainId_contractAddress: {
          chainId,
          contractAddress,
        },
      },
      data: {
        quantity: nfts.reduce(
          (acc: number, nft: any) => acc + nft.token_count,
          0
        ),
        lastUpdatedAt: new Date(),
      },
    });
  }
  return await prisma.ethereumNftOwner.findMany({
    where: {
      contractAddress,
    },
    include: {
      nft: true,
    },
  });
};

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
