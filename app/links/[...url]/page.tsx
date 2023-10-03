import { CastsTable } from "@/components/casts/casts";
import { CastsQuery, CastsSort } from "@/lib/types";

export default function Home({ params, searchParams }: CastsQuery) {
  const url = params.url?.join("/");
  return (
    <div className="flex flex-col">
      <div className="flex flex-col p-4">
        <a
          href={`https://${url}`}
          target="_blank"
          className="transition hover:dark:text-purple-400 hover:text-purple-600"
        >
          {url}
        </a>
      </div>
      <CastsTable
        sort={CastsSort.New}
        params={params}
        searchParams={searchParams}
      />
    </div>
  );
}
