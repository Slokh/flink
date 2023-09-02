export const Navbar = ({ variant }: { variant: "top" | "bottom" }) => (
  <div
    className={`flex flex-row border-${
      variant === "top" ? "b-2" : "t-2"
    } p-2 justify-between items-center w-full`}
  >
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
          <span className="text-slate-400 font-normal">on flink</span>
        </a>
      </div>
    </div>
  </div>
);
