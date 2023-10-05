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
          href={`/${params.id}/settings`}
          isSelected={pathname.endsWith("settings")}
        >
          Profile
        </NavigationButton>
        <NavigationButton
          href={`/${params.id}/settings/apps`}
          isSelected={pathname.endsWith("apps")}
        >
          Apps
        </NavigationButton>
        <NavigationButton
          href={`/${params.id}/settings/storage`}
          isSelected={pathname.endsWith("storage")}
        >
          Storage
        </NavigationButton>
        <NavigationButton
          href={`/${params.id}/settings/advanced`}
          isSelected={pathname.endsWith("advanced")}
        >
          Advanced
        </NavigationButton>
      </NavigationGroup>
    </Navigation>
  );
};
