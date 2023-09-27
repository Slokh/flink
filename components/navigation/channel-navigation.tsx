"use client";
import { CastsSort } from "@/lib/types";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Navigation,
  NavigationButton,
  NavigationGroup,
  NavigationSelect,
} from "./navigation";

export const ChannelNavigation = ({}: {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const sort = pathname.endsWith("top")
    ? CastsSort.Top
    : pathname.endsWith("new")
    ? CastsSort.New
    : CastsSort.Hot;
  const time =
    sort === CastsSort.Top ? searchParams.get("time") || "day" : undefined;

  return (
    <Navigation>
      <NavigationGroup />
      <NavigationGroup>
        {sort === CastsSort.Top && (
          <NavigationSelect
            defaultValue={time || "day"}
            onValueChange={(value) => router.push(`${pathname}?time=${value}`)}
            placeholder="Timeframe"
            options={[
              { value: "hour", label: "Last hour" },
              { value: "day", label: "Last day" },
              { value: "week", label: "Last week" },
              { value: "month", label: "Last month" },
              { value: "year", label: "Last year" },
              { value: "all", label: "All time" },
            ]}
          />
        )}
        <NavigationButton
          href={`/channels/${params.channel}`}
          isSelected={sort === CastsSort.Hot}
        >
          Hot
        </NavigationButton>
        <NavigationButton
          href={`/channels/${params.channel}/new`}
          isSelected={sort === CastsSort.New}
        >
          New
        </NavigationButton>
        <NavigationButton
          href={`/channels/${params.channel}/top`}
          isSelected={sort === CastsSort.Top}
        >
          Top
        </NavigationButton>
      </NavigationGroup>
    </Navigation>
  );
};
