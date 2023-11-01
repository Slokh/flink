"use client";
import { CastsSort, DisplayMode } from "@/lib/types";
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
import { useUser } from "@/context/user";

export const ChannelNavigation = () => {
  // const [membersEnabled, setMembersEnabled] = useState(false);
  const { displayMode, changeDisplayMode } = useUser();
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

  // const channelId = params.channel as string;
  // const channel =
  //   CHANNELS_BY_ID[channelId]?.parentUrl || decodeURIComponent(channelId);

  // useEffect(() => {
  //   const handle = async () => {
  //     const res = await fetch(`/api/f/${encodeURIComponent(channel)}`);
  //     const { collection } = await res.json();
  //     if (collection.quantity > 500) {
  //       setMembersEnabled(true);
  //     }
  //   };
  //   handle();
  // }, [channel]);

  return (
    <Navigation>
      <NavigationGroup>
        <NavigationButton
          href={`/f/${params.channel}`}
          isSelected={mainNav === "casts"}
        >
          Casts
        </NavigationButton>
        <NavigationButton
          href={`/f/${params.channel}/stats`}
          isSelected={mainNav === "stats"}
        >
          Stats
        </NavigationButton>
        {/* {membersEnabled && (
          <NavigationButton
            href={`/f/${params.channel}/members`}
            isSelected={mainNav === "members"}
          >
            Members
          </NavigationButton>
        )} */}
      </NavigationGroup>
      {mainNav === "casts" && (
        <NavigationGroup>
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
            href={`/f/${params.channel}${
              displayMode === DisplayMode.Images ? "?display=images" : ""
            }`}
            isSelected={sort === CastsSort.Hot}
          >
            Hot
          </NavigationButton>
          <NavigationButton
            href={`/f/${params.channel}/new${
              displayMode === DisplayMode.Images ? "?display=images" : ""
            }`}
            isSelected={sort === CastsSort.New}
          >
            New
          </NavigationButton>
          <NavigationButton
            href={`/f/${params.channel}/top${
              displayMode === DisplayMode.Images ? "?display=images" : ""
            }`}
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
            href={`/f/${params.channel}/stats`}
            isSelected={!pathname.endsWith("users")}
          >
            Overview
          </NavigationButton>
          <NavigationButton
            href={`/f/${params.channel}/stats/users`}
            isSelected={pathname.endsWith("users")}
          >
            Users
          </NavigationButton>
        </NavigationGroup>
      )}
    </Navigation>
  );
};
