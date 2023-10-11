"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const SearchInput = () => {
  const router = useRouter();
  const params = useParams();
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (params.query) {
      setSearch(params.query as string);
    } else {
      setSearch("");
    }
  }, [params.query]);

  const handleClick = () => {
    if (!search) return;
    router.push(`/search/${encodeURIComponent(search)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleClick();
    }
  };

  return (
    <div className="relative">
      <Input
        id="name"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pr-8 bg-muted"
      />
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-0 h-full border-0"
        onClick={handleClick}
      >
        <MagnifyingGlassIcon />
      </Button>
    </div>
  );
};
