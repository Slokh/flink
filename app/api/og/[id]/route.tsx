import { Entity } from "@/lib/types";
import { headers } from "next/headers";
import { ImageResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: { id: string; create: boolean } }
) {
  const { id } = params;

  const host = headers().get("host");
  const protocol = process?.env.NODE_ENV === "development" ? "http" : "https";
  const response = await fetch(`${protocol}://${host}/api/users/${id}`);
  if (!response.ok) {
    return new ImageResponse(<img src="/flink.png" />);
  }

  const { pfp, bio, accounts, ethereum }: Entity = await response.json();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "black",
          color: "white",
          fontFamily: "Inter",
          padding: "72px",
        }}
      >
        <div tw="flex flex-col items-start justify-start w-full h-full">
          <div tw="flex flex-row items-center w-full">
            <img tw="w-80 h-80 rounded-full" src={pfp?.value} />
            <div tw="flex flex-col w-full items-start justify-start ml-12">
              <div tw="flex text-9xl text-center">
                <span tw="font-light text-slate-600">flink.fyi/</span>
                <span tw="font-bold">{id}</span>
              </div>
              <div tw="flex w-5/6 mt-4">
                <div tw="flex text-6xl whitespace-normal">{bio?.value}</div>
              </div>
            </div>
          </div>
          <div tw="flex flex-row items-center justify-start w-full flex-wrap mt-16">
            {accounts.map((account, i) => (
              <div
                tw="flex flex-row items-center justify-start border-4 border-slate-800 rounded-3xl p-8 mr-16 mt-16"
                key={i}
              >
                <div tw="flex w-24 justify-center align-center">
                  <img
                    tw="h-24"
                    src={`${protocol}://${host}/${account.platform.toLowerCase()}.png`}
                  />
                </div>
                <div tw="flex flex-col items-start justify-start ml-8">
                  <div tw="flex text-6xl text-center">
                    <span tw="font-bold">{account.username}</span>
                  </div>
                  <div tw="flex text-5xl text-slate-500">
                    {account.platform}
                  </div>
                </div>
              </div>
            ))}
            {ethereum.map(({ address, ensName, verified }, i) => {
              const formattedAddress = `${address.substring(
                0,
                6
              )}...${address.substring(address.length - 4)}`;
              return (
                <div
                  tw="flex flex-row items-center justify-start border-4 border-slate-800 rounded-3xl p-8 mr-16 mt-16"
                  key={i}
                >
                  <div tw="flex w-24 justify-center align-center">
                    <img tw="h-24" src={`${protocol}://${host}/ethereum.png`} />
                  </div>
                  <div tw="flex flex-col items-start justify-start ml-8">
                    <div tw="flex text-6xl text-center">
                      <span tw="font-bold">{ensName || formattedAddress}</span>
                    </div>
                    <div tw="flex text-5xl text-slate-500">
                      {ensName ? `Ethereum (${formattedAddress})` : "Ethereum"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    {
      width: 2400,
      height: 1260,
    }
  );
}
