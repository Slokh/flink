import { getTransactionMetadata } from "../embeds/transactions";
import prisma from "../lib/prisma";

const run = async () => {
  const urls = await prisma.farcasterCastEmbedUrl.groupBy({
    by: ["url", "transactionMetadata"],
    where: {
      OR: [
        {
          url: {
            contains: "app.manifold.xyz/c/",
          },
          timestamp: {
            gte: new Date(new Date().getTime() - 6 * 60 * 60 * 1000),
          },
        },
        {
          url: {
            contains: "zora.co/collect/",
          },
          timestamp: {
            gte: new Date(new Date().getTime() - 6 * 60 * 60 * 1000),
          },
        },
        {
          url: {
            contains: "mint.fun",
          },
          timestamp: {
            gte: new Date(new Date().getTime() - 6 * 60 * 60 * 1000),
          },
        },
      ],
    },
  });
  for (const url of urls) {
    const transactionMetadata = await getTransactionMetadata(url.url);
    console.log(
      url.url,
      !!transactionMetadata?.transaction,
      !!transactionMetadata?.metadata,
      transactionMetadata?.token
    );
    await prisma.farcasterCastEmbedUrl.updateMany({
      where: {
        url: url.url,
      },
      data: {
        transactionMetadata: transactionMetadata || {},
      },
    });
  }
};

run();
