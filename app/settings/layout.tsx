import { SettingsOverview } from "@/components/settings/settings-overview";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col space-y-2">
      <div className="text-2xl font-semibold p-2">Settings</div>
      <SettingsOverview />
      {children}
    </div>
  );
}
