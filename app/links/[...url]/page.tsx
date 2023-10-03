import { CastsTable } from "@/components/casts/casts";
import { LinksNavigation } from "@/components/navigation/links-navigation";
import { CastsQuery, CastsSort } from "@/lib/types";

export default function Home({ params, searchParams }: CastsQuery) {
  if (!params.url) return <></>;
  const isTop = params.url[params.url.length - 1] === "top";
  const url = (isTop ? params.url.slice(0, -1) : params.url).join("/");
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row items-center justify-between border-b pl-2">
        <a
          href={`https://${url}`}
          target="_blank"
          className="transition hover:dark:text-purple-400 hover:text-purple-600"
        >
          {url}
        </a>
        <LinksNavigation />
      </div>
      <CastsTable
        sort={isTop ? CastsSort.Top : CastsSort.New}
        params={params}
        searchParams={searchParams}
      />
    </div>
  );
}
