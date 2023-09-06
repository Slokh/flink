"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useState } from "react";

export const RefreshButton = ({ id }: { id: string }) => {
  const [loading, setLoading] = useState<boolean>(false);

  const handleClick = async () => {
    setLoading(true);
    await fetch(`/api/users/${id}/refresh`);
    window.location.reload();
  };

  return (
    <Button className="w-full" disabled={loading} onClick={handleClick}>
      {loading ? (
        <img src="/loading.svg" alt="loading" className="w-5 h-5" />
      ) : (
        "Refresh"
      )}
    </Button>
  );
};
