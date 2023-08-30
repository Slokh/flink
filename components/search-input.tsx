"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const SearchInput = () => {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");

  const handleClick = () => {
    router.push(`/user/${search}`);
  };

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input
        id="name"
        placeholder="slokh.eth"
        onChange={(e) => setSearch(e.target.value)}
      />
      <Button onClick={handleClick}>Search</Button>
    </div>
  );
};
