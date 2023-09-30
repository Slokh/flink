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

export const UserNavigation = ({}: {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const sort = pathname.endsWith("top")
    ? CastsSort.Top
    : pathname.endsWith("top-replies")
    ? CastsSort.TopReplies
    : pathname.endsWith("new-replies")
    ? CastsSort.NewReplies
    : CastsSort.New;
  const time =
    sort === CastsSort.Top ? searchParams.get("time") || "day" : undefined;

  const mainNav = pathname.includes("stats") ? "stats" : "casts";

  return (
    <Navigation>
      <NavigationGroup className="hidden md:flex">
        <NavigationButton
          href={`/${params.id}`}
          isSelected={mainNav === "casts"}
        >
          Casts
        </NavigationButton>
        <NavigationButton
          href={`/${params.id}/stats`}
          isSelected={mainNav === "stats"}
        >
          Stats
        </NavigationButton>
      </NavigationGroup>
      {mainNav === "casts" && (
        <NavigationGroup>
          {sort === CastsSort.Top && (
            <NavigationSelect
              defaultValue={time || "day"}
              onValueChange={(value) =>
                router.push(`${pathname}?time=${value}`)
              }
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
            href={`/${params.id}`}
            isSelected={sort === CastsSort.New}
          >
            New
          </NavigationButton>
          <NavigationButton
            href={`/${params.id}/top`}
            isSelected={sort === CastsSort.Top}
          >
            Top
          </NavigationButton>
          <NavigationButton
            href={`/${params.id}/new-replies`}
            isSelected={sort === CastsSort.NewReplies}
          >
            New Replies
          </NavigationButton>
          <NavigationButton
            href={`/${params.id}/top-replies`}
            isSelected={sort === CastsSort.TopReplies}
          >
            Top Replies
          </NavigationButton>
        </NavigationGroup>
      )}
      {mainNav === "stats" && (
        <NavigationGroup>
          {pathname.endsWith("channels") && (
            <NavigationSelect
              defaultValue={time || "all"}
              onValueChange={(value) =>
                router.push(`${pathname}?time=${value}`)
              }
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
            href={`/${params.id}/stats`}
            isSelected={!pathname.endsWith("channels")}
          >
            Overview
          </NavigationButton>
          <NavigationButton
            href={`/${params.id}/stats/channels`}
            isSelected={pathname.endsWith("channels")}
          >
            Channels
          </NavigationButton>
        </NavigationGroup>
      )}
    </Navigation>
  );
};
