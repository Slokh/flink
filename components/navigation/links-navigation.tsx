"use client";
import { CastsSort } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Navigation,
  NavigationButton,
  NavigationGroup,
  NavigationSelect,
} from "./navigation";

export const LinksNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = pathname.endsWith("top") ? CastsSort.Top : CastsSort.New;
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
        <NavigationButton
          href={`${pathname}/`}
          isSelected={sort === CastsSort.New}
        >
          New
        </NavigationButton>
        <NavigationButton
          href={`${pathname}/${pathname.endsWith("top") ? "" : "top"}`}
          isSelected={sort === CastsSort.Top}
        >
          Top
        </NavigationButton>
      </NavigationGroup>
    </Navigation>
  );
};
