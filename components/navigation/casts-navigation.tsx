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
import { useEffect, useState } from "react";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const CastsNavigation = () => {
  const [active, setActive] = useState(0);
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

  useEffect(() => {
    const handle = async () => {
      const res = await fetch("/api/stats/users/active");
      const { active } = await res.json();
      setActive(active);
    };
    handle();
  }, []);

  return (
    <Navigation>
      <NavigationGroup>
        {active > 0 && (
          <div className="flex flex-row text-sm items-center space-x-1">
            <svg
              className="animate-pulse h-2 w-2 text-green-500"
              viewBox="0 0 24 24"
            >
              <circle
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="currentColor"
                cx="12"
                cy="12"
                r="10"
              />
            </svg>
            <div>{`${active} users online`}</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <QuestionMarkCircledIcon className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Users who casted or reacted in the last 5 minutes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </NavigationGroup>
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
