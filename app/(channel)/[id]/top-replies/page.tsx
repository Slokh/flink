import { CastsQuery, CastsSort } from "@/lib/types";
import { UserCastsTable } from "@/components/casts/casts";

export default async function User({ params, searchParams }: CastsQuery) {
  return (
    <UserCastsTable
      sort={CastsSort.TopReplies}
      params={params}
      searchParams={searchParams}
    />
  );
}
