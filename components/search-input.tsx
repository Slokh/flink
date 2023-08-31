"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const SearchInput = () => {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");

  const handleClick = () => {
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
        placeholder="Search by farcaster, twitter, eth address, ens, etc."
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Button onClick={handleClick}>Search</Button>
    </div>
  );
};
