import { SettingsNavigation } from "@/components/navigation/settings-navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col space-y-2">
      <div className="text-2xl font-semibold p-2">Settings</div>
      <SettingsNavigation />
      {children}
    </div>
  );
}
