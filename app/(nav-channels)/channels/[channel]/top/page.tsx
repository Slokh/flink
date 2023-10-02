import { CastsTable } from "@/components/casts/casts";
import { CastsQuery, CastsSort } from "@/lib/types";

export default function Home({ params, searchParams }: CastsQuery) {
  return (
    <CastsTable
      sort={CastsSort.Top}
      params={params}
      searchParams={searchParams}
    />
  );
}
