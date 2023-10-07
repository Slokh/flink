"use client";
import { useParams, usePathname } from "next/navigation";
import { Navigation, NavigationButton, NavigationGroup } from "./navigation";

export const SettingsNavigation = () => {
  const pathname = usePathname();
  const params = useParams();
  return (
    <Navigation>
      <NavigationGroup>
        <NavigationButton
          href={`/settings`}
          isSelected={pathname.endsWith("settings")}
        >
          Profile
        </NavigationButton>
        <NavigationButton
          href={`/settings/apps`}
          isSelected={pathname.endsWith("apps")}
        >
          Apps
        </NavigationButton>
        {/* <NavigationButton
          href={`/settings/storage`}
          isSelected={pathname.endsWith("storage")}
        >
          Storage
        </NavigationButton> */}
        <NavigationButton
          href={`/settings/advanced`}
          isSelected={pathname.endsWith("advanced")}
        >
          Advanced
        </NavigationButton>
      </NavigationGroup>
    </Navigation>
  );
};
