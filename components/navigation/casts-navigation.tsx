"use client";
import { CastsSort } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Navigation,
  NavigationButton,
  NavigationGroup,
  NavigationSelect,
} from "./navigation";
import { useUser } from "@/context/user";

export const CastsNavigation = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = pathname.endsWith("top")
    ? CastsSort.Top
    : pathname.endsWith("new")
    ? CastsSort.New
    : pathname.endsWith("home")
    ? CastsSort.Home
    : CastsSort.Hot;
  const time =
    sort === CastsSort.Top ? searchParams.get("time") || "day" : undefined;

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("time", value);
    const newQuery = params.toString();
    router.push(`${pathname}?${newQuery}`);
  };

  return (
    <Navigation>
      <NavigationGroup />
      <NavigationGroup>
        {sort === CastsSort.Top && (
          <NavigationSelect
            defaultValue={time || "day"}
            onValueChange={handleSelect}
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
        {user && (
          <NavigationButton href="/home" isSelected={sort === CastsSort.Home}>
            Home
          </NavigationButton>
        )}
        <NavigationButton href="/" isSelected={sort === CastsSort.Hot}>
          Hot
        </NavigationButton>
        <NavigationButton href={`/new`} isSelected={sort === CastsSort.New}>
          New
        </NavigationButton>
        <NavigationButton href={`/top`} isSelected={sort === CastsSort.Top}>
          Top
        </NavigationButton>
      </NavigationGroup>
    </Navigation>
  );
};
