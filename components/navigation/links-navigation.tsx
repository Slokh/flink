"use client";
import { CastsSort } from "@/lib/types";
import { usePathname } from "next/navigation";
import { Navigation, NavigationButton, NavigationGroup } from "./navigation";

export const LinksNavigation = () => {
  const pathname = usePathname();
  const sort = pathname.endsWith("top") ? CastsSort.Top : CastsSort.New;
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
