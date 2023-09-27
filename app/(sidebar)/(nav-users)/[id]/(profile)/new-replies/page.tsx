import { CastsQuery, CastsSort } from "@/lib/types";
import { CastsTable } from "@/components/casts/casts";

export default async function User({ params, searchParams }: CastsQuery) {
  return (
    <CastsTable
      sort={CastsSort.NewReplies}
      params={params}
      searchParams={searchParams}
    />
  );
}
