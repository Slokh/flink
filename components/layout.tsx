import { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col h-screen">
    <div className="flex flex-row border p-2 justify-between items-center w-full h-10">
      <div className="flex flex-col">
        <a href="/" className="font-bold">
          flink
        </a>
      </div>
      <div className="flex flex-row space-x-2 items-center">
        <div className="flex flex-col text-sm font-medium items-end">
          <a href="/slokh" className="h-full space-x-1">
            <span className="text-slate-400 font-normal">by</span>
            <span>slokh</span>
          </a>
        </div>
        <ThemeToggle />
      </div>
    </div>
    <div className="w-full" style={{ height: "calc(100vh - 40px)" }}>
      {children}
    </div>
  </div>
);
