import { AppSettings } from "@/components/settings/app-settings";

export default function Home() {
  return (
    <div className="p-2">
      Manage your storage at{" "}
      <a
        href="https://caststorage.com/"
        target="_blank"
        className="text-purple:600 dark:text-purple-400"
      >
        caststorage.com
      </a>
    </div>
  );
}
