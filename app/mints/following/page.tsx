import { MintsDisplay } from "@/components/mints/mints-display";

export default function Home({
  searchParams,
}: {
  searchParams: { page?: string; following?: boolean };
}) {
  return (
    <div className="w-full">
      <MintsDisplay
        page={parseInt(searchParams.page || "1")}
        onlyFollowing={true}
      />
    </div>
  );
}
