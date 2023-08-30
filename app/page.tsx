import { SearchInput } from "@/components/search-input";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center mt-16 md:mt-32 w-full p-4 space-y-4">
      <div className="flex flex-col w-108 items-center space-y-4 text-center">
        <div className="text-4xl">flink</div>
        <div className="text-sm md:text-lg text-slate-400">
          Search by ETH address, ENS, Farcaster, or Twitter user...
        </div>
        <div className="text-sm md:text-lg text-slate-400">
          Flink tries to automatically bring as many of these identities
          together as possible!
        </div>
        <SearchInput />
      </div>
    </div>
  );
}
