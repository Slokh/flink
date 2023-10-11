import { SearchNavigation } from "@/components/navigation/search-navigation";

export default function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { query: string };
}) {
  return (
    <div className="w-full flex flex-col space-y-2">
      <div className="text-2xl font-semibold p-2">{`Search results for "${decodeURIComponent(
        params.query
      )}"`}</div>
      <SearchNavigation />
      {children}
    </div>
  );
}
