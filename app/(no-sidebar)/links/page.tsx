import { LinksTable } from "@/components/stats/links-table";
import { getLinkEngagementStats } from "@/lib/requests";

export default async function Home({
  searchParams,
}: {
  searchParams: { time?: string };
}) {
  const time = searchParams.time || "day";
  const links = await getLinkEngagementStats(time);

  return (
    <div className="w-full">
      <LinksTable links={links} time={time} />
    </div>
  );
}
