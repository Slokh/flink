import { CastsQuery, CastsSort } from "@/lib/types";
import { UserCastsTable } from "@/components/casts/casts";
import { getEntity } from "@/lib/requests";
import { Profile } from "@/components/ui/profile";

export default async function User({ params, searchParams }: CastsQuery) {
  const entity = await getEntity(params.id, true);
  return (
    <>
      <div className="flex justify-center lg:hidden">
        <Profile id={params.id} entity={entity} />
      </div>
      <UserCastsTable
        sort={CastsSort.New}
        params={params}
        searchParams={searchParams}
      />
    </>
  );
}
