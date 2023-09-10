"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const SearchInput = () => {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleClick = () => {
    if (!search) return;
    setLoading(true);
    router.push(`/${search}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleClick();
    }
  };

  return (
    <div className="flex w-full items-center space-x-2">
      <Input
        id="name"
        placeholder="Search..."
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Button className="w-32" disabled={loading} onClick={handleClick}>
        {loading ? (
          <img src="/loading.svg" alt="loading" className="w-5 h-5" />
        ) : (
          "Search"
        )}
      </Button>
    </div>
  );
};
