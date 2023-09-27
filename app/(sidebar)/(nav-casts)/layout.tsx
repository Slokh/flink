import { CastsNavigation } from "@/components/navigation/casts-navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-full h-full flex-grow">
      <CastsNavigation />
      {children}
    </div>
  );
}
