import { RandomEntities } from "@/components/random-entities";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center mt-8 md:mt-24 w-full p-4 space-y-4">
        <div className="flex flex-col w-full max-w-xl items-start space-y-2 text-start">
          <div className="text-4xl">flink</div>
          <div className="text-sm md:text-lg text-slate-500">
            (f)arcaster link
          </div>
          <div className="text-sm md:text-lg">
            flink tries to automatically link your identities across Farcaster,
            Twitter, Ethereum, and more!{" "}
          </div>
        </div>
        <RandomEntities amount={8} />
      </div>
    </>
  );
}
