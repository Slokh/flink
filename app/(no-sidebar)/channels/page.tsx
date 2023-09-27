import { Channels } from "@/components/channels/channels";

export default async function Home({
  searchParams,
}: {
  searchParams: { time?: string };
}) {
  const time = searchParams.time || "day";
  return <Channels time={time === "all" ? "year" : time} />;
}
