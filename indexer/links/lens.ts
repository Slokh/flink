import { Link } from "../db/link";
import { fetchWithRetry } from "../util";

export const getLensLinks = async (address: string): Promise<Link[]> => {
  const data = await fetchWithRetry("https://api.lens.dev/", {
    method: "POST",
    body: JSON.stringify({
      query: `
            query($address: EthereumAddress!) {
              profiles(request:{ownedBy:[$address]}) {
                items{
                  handle
                  bio
                  metadata
                  ownedBy
                  name
                  picture {
                    ...on MediaSet {
                      original{
                        url
                      }
                    }
                  }
                }
              }
            }`,
      variables: {
        address,
      },
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!data?.data?.profiles?.items?.length) {
    return [];
  }

  const items = data.data.profiles.items;

  const links: Link[] = items.map((item: any) => ({
    url: `https://www.lensfrens.xyz/${item.handle}`,
    verified: true,
    source: "LENS",
    sourceInput: address,
    metadata: {
      pfp: item.picture?.original?.url || undefined,
      bio: item.bio || undefined,
      display: item.name || undefined,
    },
  }));

  const referencedLinks = await Promise.all(
    items.map(async (item: any) => {
      let website;
      let twitter;
      if (!item.metadata) {
        return [];
      }
      const url = item.metadata
        .replace("ar://", "https://arweave.dev/")
        .replace("https://arweave.net", "https://arweave.dev")
        .replace("ipfs://", "https://ipfs.io/ipfs/");

      const data = await fetchWithRetry(url);
      if (!data) {
        return [];
      }

      const links: Link[] = [];

      website = data?.attributes.find(
        (attr: any) => attr.key === "website"
      )?.value;
      if (website) {
        links.push({
          url: website,
          verified: false,
          source: "LENS",
          sourceInput: item.handle,
          metadata: {
            sourceUrl: url,
          },
        });
      }

      twitter = data?.attributes.find(
        (attr: any) => attr.key === "twitter"
      )?.value;
      if (twitter) {
        links.push({
          url: `https://twitter.com/${twitter}`,
          verified: false,
          source: "LENS",
          sourceInput: item.handle,
          metadata: {
            sourceUrl: url,
          },
        });
      }

      return links;
    })
  );

  return links.concat(referencedLinks.flat());
};

export const getAddressFromLensHandle = async (handle: string) => {
  const data = await fetchWithRetry("https://api.lens.dev/", {
    method: "POST",
    body: JSON.stringify({
      query: `
        query($handle: Handle!) {
          profiles(request:{handles:[$handle]}) {
            items{
              ownedBy
            }
          }
        }`,
      variables: {
        handle,
      },
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!data?.data?.profiles?.items?.length) {
    return;
  }

  const item = data.data.profiles.items[0];
  if (!item) {
    return;
  }

  return item.ownedBy;
};
