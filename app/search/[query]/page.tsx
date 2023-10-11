import { CastsTable } from "@/components/casts/casts";
import { CastsSort } from "@/lib/types";

export default async function Home({
  params,
  searchParams,
}: {
  params: any;
  searchParams: any;
}) {
  return (
    <CastsTable
      sort={CastsSort.New}
      params={params}
      searchParams={searchParams}
    />
  );
}
