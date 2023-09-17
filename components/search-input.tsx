"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
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
    <div className="relative">
      <Input
        id="name"
        placeholder="Search users..."
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pr-8 border-0" // Add padding to prevent text from going under the button
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
