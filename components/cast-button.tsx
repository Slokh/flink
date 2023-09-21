"use client";
import { UserAuthState, useUser } from "@/context/user";
import { PlusIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./ui/button";
import { useState } from "react";
import { Loading } from "./loading";

export const CastButton = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { signerState, authState } = useUser();

  if (authState !== UserAuthState.LOGGED_IN) return <></>;

  const handleCast = async () => {
    await fetch("/api/casts/new", {
      method: "POST",
      body: JSON.stringify({
        signer_uuid: signerState?.signerUuid,
        text: inputValue,
      }),
    });
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="font-bold rounded-xl bg-foreground text-background p-2 pr-3 pl-3 text-center">
        <PlusIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New cast</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Type your message here."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />{" "}
        <DialogFooter>
          <Button type="submit" onClick={handleCast} disabled={loading}>
            {loading ? <Loading /> : "Cast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
