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
import { CHANNELS_BY_ID } from "@/lib/channels";
import { useEffect, useState } from "react";

export const ChannelNavigation = () => {
  const [membersEnabled, setMembersEnabled] = useState(false);
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

  const mainNav = pathname.includes("stats")
    ? "stats"
    : pathname.includes("members")
    ? "members"
    : "casts";

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("time", value);
    const newQuery = params.toString();
    router.push(`${pathname}?${newQuery}`);
  };

  const channelId = params.channel as string;
  const channel =
    CHANNELS_BY_ID[channelId]?.parentUrl || decodeURIComponent(channelId);

  useEffect(() => {
    const handle = async () => {
      const res = await fetch(`/api/channels/${encodeURIComponent(channel)}`);
      const { collection } = await res.json();
      if (collection.quantity > 500) {
        setMembersEnabled(true);
      }
    };
    handle();
  }, [channel]);

  return (
    <Navigation>
      <NavigationGroup>
        <NavigationButton
          href={`/channels/${params.channel}`}
          isSelected={mainNav === "casts"}
        >
          Casts
        </NavigationButton>
        <NavigationButton
          href={`/channels/${params.channel}/stats`}
          isSelected={mainNav === "stats"}
        >
          Stats
        </NavigationButton>
        {membersEnabled && (
          <NavigationButton
            href={`/channels/${params.channel}/members`}
            isSelected={mainNav === "members"}
          >
            Members
          </NavigationButton>
        )}
      </NavigationGroup>
      {mainNav === "casts" && (
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
      )}
      {mainNav === "stats" && (
        <NavigationGroup>
          {pathname.endsWith("users") && (
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
            href={`/channels/${params.channel}/stats`}
            isSelected={!pathname.endsWith("users")}
          >
            Overview
          </NavigationButton>
          <NavigationButton
            href={`/channels/${params.channel}/stats/users`}
            isSelected={pathname.endsWith("users")}
          >
            Users
          </NavigationButton>
        </NavigationGroup>
      )}
    </Navigation>
  );
};
