import { ChannelChart } from "@/components/stats/channel-chart";
import { getChannelStats } from "@/lib/requests";
import { CastsQuery } from "@/lib/types";

export default async function Home({ params, searchParams }: CastsQuery) {
  const { data } = await getChannelStats(params.channel);
  return (
    <div className="h-[400px]">
      <ChannelChart url={params.channel} data={data} />
    </div>
  );
}
