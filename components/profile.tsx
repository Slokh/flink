import { Account, Entity, Ethereum, Link } from "@/lib/types";
import { RefreshButton } from "./refresh-button";
import { SearchInput } from "./search-input";
import { Card, CardItem } from "./card";

export const Accounts = ({ accounts }: { accounts: Account[] }) => (
  <Card title="Accounts">
    {accounts?.map(({ platform, username, link, verified }) => (
      <CardItem
        key={username}
        platform={platform}
        identity={username}
        url={`https://${link}`}
        verified={verified}
      />
    ))}
  </Card>
);

export const Addresses = ({ ethereum }: { ethereum: Ethereum[] }) => (
  <Card title="Addresses">
    {ethereum?.map(({ address, ensName, verified }) => {
      const formattedAddress = `${address.substring(
        0,
        6
      )}...${address.substring(address.length - 4)}`;
      return (
        <CardItem
          key={address}
          platform={ensName ? `Ethereum (${formattedAddress})` : "Ethereum"}
          identity={ensName || formattedAddress}
          url={`https://etherscan.io/address/${address}`}
          verified={verified}
          image="/ethereum.png"
        />
      );
    })}
  </Card>
);

export const RelatedLinks = ({ relatedLinks }: { relatedLinks: Link[] }) => (
  <Card title="Related Links">
    {relatedLinks?.map(({ link, verified }) => (
      <CardItem
        key={link}
        platform="Website"
        identity={link.replace(/(^\w+:|^)\/\//, "")}
        url={`https://${link}`}
        verified={verified}
      />
    ))}
  </Card>
);

export const Emails = ({ emails }: { emails: Link[] }) => (
  <Card title="Emails">
    {emails?.map(({ link, verified }) => (
      <CardItem
        key={link}
        platform="Website"
        identity={link.replace(/(^\w+:|^)\/\//, "")}
        url={`mailto:${link}`}
        verified={verified}
      />
    ))}
  </Card>
);

export const Profile = ({
  entity: { accounts, ethereum, relatedLinks, emails },
  id,
}: {
  entity: Entity;
  id: string;
}) => (
  <>
    {accounts?.length > 0 && <Accounts accounts={accounts} />}
    {ethereum?.length > 0 && <Addresses ethereum={ethereum} />}
    {relatedLinks?.length > 0 && <RelatedLinks relatedLinks={relatedLinks} />}
    {emails?.length > 0 && <Emails emails={emails} />}
    <RefreshButton id={id} />
    <SearchInput />
  </>
);
