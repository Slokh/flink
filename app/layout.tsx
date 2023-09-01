import { ThemeProvider } from "@/components/theme-provider";
import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flink",
  description:
    "Automatically link your Ethereum, Farcaster, and Twitter accounts",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen items-start bg-[#0a0a0b]">
            <div className="flex flex-row border-b p-2 justify-between items-center w-full">
              <div className="flex flex-col">
                <a href="/" className="font-bold">
                  flink
                </a>
                <div className="text-sm text-slate-400">
                  farcaster ♥ twitter ♥ eth
                </div>
              </div>
              <div className="flex flex-row space-x-2 items-center">
                <div className="flex flex-col text-sm font-medium items-end">
                  <a href="https://twitter.com/Slokh">
                    slokh{" "}
                    <span className="text-slate-400 font-normal">
                      on twitter
                    </span>
                  </a>
                  <a href="https://warpcast.com/slokh">
                    slokh{" "}
                    <span className="text-slate-400 font-normal">
                      on farcaster
                    </span>
                  </a>
                </div>
              </div>
            </div>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
