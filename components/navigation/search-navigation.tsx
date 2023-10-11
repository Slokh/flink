"use client";
import { useParams, usePathname } from "next/navigation";
import {
  Navigation,
  NavigationButton,
  NavigationGroup,
  NavigationSelect,
} from "./navigation";
import { useUser } from "@/context/user";
import { DisplayMode } from "@/lib/types";

export const SearchNavigation = () => {
  const { displayMode, changeDisplayMode } = useUser();
  const params = useParams();
  const pathname = usePathname();

  return (
    <Navigation>
      <NavigationGroup />
      <NavigationGroup>
        {!pathname.endsWith("users") && (
          <div className="hidden sm:flex">
            <NavigationSelect
              defaultValue={displayMode}
              onValueChange={() =>
                changeDisplayMode(
                  displayMode === DisplayMode.Default
                    ? DisplayMode.Images
                    : DisplayMode.Default
                )
              }
              placeholder="Display mode"
              options={[
                { value: DisplayMode.Default, label: "Default" },
                { value: DisplayMode.Images, label: "Images" },
              ]}
            />
          </div>
        )}
        <NavigationButton
          href={`/search/${params.query}`}
          isSelected={!pathname.endsWith("top") && !pathname.endsWith("users")}
        >
          New
        </NavigationButton>
        <NavigationButton
          href={`/search/${params.query}/top`}
          isSelected={pathname.endsWith("top")}
        >
          Top
        </NavigationButton>
        <NavigationButton
          href={`/search/${params.query}/users`}
          isSelected={pathname.endsWith("users")}
        >
          Users
        </NavigationButton>
      </NavigationGroup>
    </Navigation>
  );
};
