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
        },
        {
          url: {
            contains: "zora.co/collect/",
          },
        },
        {
          url: {
            contains: "mint.fun",
          },
        },
      ],
    },
  });
  const filteredUrls = urls.filter(
    // @ts-ignore
    (url) => !url.transactionMetadata?.token
  );
  for (const url of filteredUrls) {
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
