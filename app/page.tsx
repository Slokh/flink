import { SearchInput } from "@/components/search-input";

export default function Home() {
  return (
    <div className="flex flex-col items-center mt-8 md:mt-24 w-full p-4 space-y-4">
      <div className="flex flex-col w-full max-w-xl items-start space-y-2 text-start">
        <div className="text-4xl">(f)link</div>
        <div className="text-sm md:text-lg text-slate-500">farcaster link</div>
        <div className="text-sm md:text-lg">
          (f)link tries to automatically unite your identities across Farcaster,
          Twitter, and Ethereum.{" "}
          <a href="/slokh" className="underline" target="_blank">
            try it out.
          </a>
        </div>
        <SearchInput />
      </div>
    </div>
  );
}
