import { Entity } from "@/lib/types";
import { headers } from "next/headers";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";

const getRandomEntities = async (amount?: number): Promise<Entity[]> => {
  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const data = await (await fetch(`${protocol}://${host}/api/random`)).json();
  if (amount) return data.slice(0, amount);
  return data;
};

const RandomEntity = ({ entity }: { entity: Entity }) => {
  const { pfps, displays, bios, accounts } = entity;
  const pfp = pfps[0];
  const display = displays[0];
  const bio = bios[0];

  return (
    <Card className="w-full sm:w-80 h-80 m-2">
      <a href={`/${entity.accounts[0].username}`}>
        <CardContent className="flex flex-col items-center space-y-2 p-4">
          <Avatar>
            <AvatarImage src={pfp?.value} className="object-cover" />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
          <div className="font-semibold text-2xl text-center">
            {display?.value}
          </div>
          <div className="text-center text-slate-500">{`${
            accounts.length
          } account${accounts.length > 1 ? "s" : ""} linked`}</div>
          <div className="text-center w-full h-64 text-sm">{bio?.value}</div>
        </CardContent>
      </a>
    </Card>
  );
};

export const RandomEntities = async ({ amount }: { amount?: number }) => {
  const randomEntities = await getRandomEntities(amount);

  return (
    <div className="w-full max-w-screen-2xl pt-8 space-y-8">
      <div className="text-2xl text-center font-semibold">
        Explore Farcaster Users
      </div>
      <div className="flex flex-row flex-wrap justify-center flex items-center">
        {randomEntities.map((entity, i) => (
          <RandomEntity key={i} entity={entity} />
        ))}
      </div>
    </div>
  );
};
