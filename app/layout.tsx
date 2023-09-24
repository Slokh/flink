import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "@rainbow-me/rainbowkit/styles.css";
import WalletProvider from "./wallet";
import { Nav } from "@/components/nav";

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
              <Nav />
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
