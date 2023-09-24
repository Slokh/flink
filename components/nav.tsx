"use client";
import Link from "next/link";
import { AuthButton } from "./auth-button";
import { NewCastButton } from "./actions/new-cast";
import { usePathname } from "next/navigation";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useState } from "react";

export const Nav = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isChannels = pathname.startsWith("/channels");
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden lg:flex flex-row border p-1 justify-between items-center w-full">
        <div className="flex flex-row space-x-8 items-center">
          <Link href="/" className="font-bold">
            flink
          </Link>
          <div className="flex flex-row items-center text-sm font-medium space-x-4 text-muted-foreground">
            <Link
              href="/"
              className={`hover:text-foreground transition ${
                isHome ? "font-semibold text-foreground" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="/channels"
              className={`hover:text-foreground transition ${
                isChannels ? "font-semibold text-foreground" : ""
              }`}
            >
              Channels
            </Link>
          </div>
        </div>
        <div className="flex flex-row text-sm font-medium items-center space-x-2">
          <AuthButton />
          <NewCastButton />
        </div>
      </div>
      <div className="flex lg:hidden flex-col border p-1 w-full">
        <div className="flex flex-row justify-between items-center w-full">
          <Link href="/" className="font-bold">
            flink
          </Link>
          <HamburgerMenuIcon onClick={() => setOpen(!open)} />
        </div>
        {open && (
          <div className="flex flex-col space-y-2 p-1 text-sm">
            <Link
              href="/"
              className={`hover:text-foreground transition ${
                isHome ? "font-semibold text-foreground" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="/channels"
              className={`hover:text-foreground transition ${
                isChannels ? "font-semibold text-foreground" : ""
              }`}
            >
              Channels
            </Link>
            <AuthButton />
            <NewCastButton />
          </div>
        )}
      </div>
    </>
  );
};
