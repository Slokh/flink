"use client";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useUser } from "@/context/user";
import { PollVoteButton } from "../actions/new-cast";
import { Poll } from "@/lib/types";
export const PollEmbed = ({ url }: { url: string }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const pollId = url.split("/").pop();
  const { user } = useUser();

  useEffect(() => {
    if (!pollId) return;
    fetch(`/api/polls/${pollId}`)
      .then((res) => res.json())
      .then((poll) => setPoll(poll));
  }, [pollId]);

  const totalVotes = poll?.results.reduce(
    (total, result) => total + result.votes,
    0
  );

  if (!poll) return <></>;

  return (
    <div className="text-sm flex flex-col space-y-2">
      {user && (
        <>
          <div className="font-semibold">Vote</div>
          <div className="flex flex-row flex-wrap">
            {poll.results.map((_, i) => (
              <PollVoteButton hash={poll.hash} option={i + 1} key={i} />
            ))}
          </div>
        </>
      )}
      <div className="font-semibold">Results</div>
      <div className="flex flex-col space-y-2">
        {poll.results.map((result) => {
          const votePercentage = totalVotes
            ? ((result.votes / totalVotes) * 100).toFixed(0)
            : 0;
          return (
            <div key={result.option} className="flex flex-col">
              <div className="flex flex-row justify-between items-center w-full">
                <span className="mr-2">{result.option}</span>
                <div className="whitespace-nowrap items-start justify-start flex">
                  ({votePercentage}%) {result.votes}
                </div>
              </div>
              {result.votes > 0 && (
                <div
                  className="h-5 mr-2 bg-foreground rounded"
                  style={{ width: `${votePercentage}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
