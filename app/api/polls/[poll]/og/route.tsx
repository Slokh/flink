import { Embed, FarcasterCast, NftMetadata } from "@/lib/types";
import { ImageResponse } from "next/server";
import { Metadata } from "unfurl.js/dist/types";

export const runtime = "edge";

type Poll = {
  hash: string;
  prompt: string;
  results: {
    option: string;
    votes: number;
  }[];
};

export async function GET(
  request: Request,
  { params }: { params: { poll: string } }
) {
  const res = await fetch(`http://localhost:3000/api/polls/${params.poll}`);
  const { prompt, results }: Poll = await res.json();
  const inter = await fetch(
    new URL("../../../../../assets/Inter-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());
  const interSemiBold = await fetch(
    new URL("../../../../../assets/Inter-SemiBold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());
  const interBold = await fetch(
    new URL("../../../../../assets/Inter-Bold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const totalVotes = results.reduce((total, result) => total + result.votes, 0);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "black",
          color: "white",
          fontFamily: "Inter",
        }}
      >
        <div tw="flex flex-col p-8 text-4xl">
          <div className="font-medium">{prompt}</div>
          {results.map((result, i) => {
            const votePercentage = totalVotes
              ? ((result.votes / totalVotes) * 100).toFixed(0)
              : 0;
            return (
              <div
                key={result.option}
                tw={`flex flex-col mt-${i === 0 ? "12" : "4"}`}
              >
                <div tw="flex flex-row justify-between items-center w-full">
                  <div tw="flex font-semibold">{result.option}</div>
                  <div tw="items-start justify-start flex text-2xl">
                    ({votePercentage}%) {result.votes}
                  </div>
                </div>
                <div
                  tw="flex h-8 bg-white rounded"
                  style={{ width: `${votePercentage}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: inter,
          style: "normal",
          weight: 400,
        },
        {
          name: "Inter",
          data: interSemiBold,
          style: "normal",
          weight: 600,
        },
        {
          name: "Inter",
          data: interBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
