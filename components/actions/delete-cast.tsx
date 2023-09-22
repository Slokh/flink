"use client";

import { useUser } from "@/context/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Loading } from "../loading";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export const DeleteCast = ({
  hash,
  children,
  isReply,
}: {
  hash: string;
  children: React.ReactNode;
  isReply?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, signerState } = useUser();

  if (!user?.casts[hash]) return <></>;

  const handleDelete = async () => {
    setLoading(true);
    await fetch("/api/casts", {
      method: "DELETE",
      body: JSON.stringify({
        signer_uuid: signerState?.signerUuid,
        target_hash: hash,
      }),
    });
    while (true) {
      const res2 = await fetch(`/api/casts/${hash}`);
      if (!res2.ok) {
        if (isReply) {
          router.refresh();
        } else {
          router.push(`/${user?.fname}`);
        }
        setOpen(false);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            cast.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={loading}
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground"
          >
            {loading ? <Loading /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
