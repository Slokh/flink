import { Channels } from "@/components/channels/channels";

export default function Home({
  searchParams,
}: {
  searchParams: { time?: string };
}) {
  const time = searchParams.time || "sixHour";
  return <Channels time={time === "all" ? "year" : time} />;
}
