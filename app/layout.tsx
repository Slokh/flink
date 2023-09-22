import { ThemeProvider } from "@/components/theme-provider";
import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "@rainbow-me/rainbowkit/styles.css";
import WalletProvider from "./wallet";
import { AuthButton } from "@/components/auth-button";
import { NewCast } from "@/components/actions/new-cast";
import { PlusIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "flink",
  description: "Automatically linked identities across platforms and protocols",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flink.fyi",
    title: "flink",
    description:
      "Automatically linked identities across platforms and protocols",
    images: [
      {
        url: "/flink.png",
        width: 1200,
        height: 630,
        alt: "flink",
      },
    ],
    siteName: "flink",
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
          <WalletProvider>
            <div className="flex flex-col h-screen">
              <div className="flex flex-row border p-1 justify-between items-center w-full">
                <Link href="/" className="font-bold">
                  flink{" "}
                  <span className="font-normal text-zinc-500 text-xs">
                    (read-only)
                  </span>
                </Link>
                <div className="flex flex-row text-sm font-medium items-center space-x-2">
                  {/* <a href="/slokh" className="h-full space-x-1">
                      <span className="text-slate-400 font-normal">by</span>
                      <span>slokh</span>
                    </a> */}
                  {/* <ThemeToggle /> */}
                  <AuthButton />
                  <NewCast>
                    <div className="flex flex-row space-x-2 items-center font-semibold rounded-xl bg-foreground text-background p-2 text-center">
                      <PlusIcon />
                      New cast
                    </div>
                  </NewCast>
                </div>
              </div>
              <div
                className="w-full flex"
                style={{ height: "calc(100vh - 40px)" }}
              >
                {children}
              </div>
            </div>
          </WalletProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
