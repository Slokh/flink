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
  description:
    "A Reddit-like interface for Farcaster to see hot & trending conversations",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flink.fyi",
    title: "flink",
    description:
      "A Reddit-like interface for Farcaster to see hot & trending conversations",
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
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WalletProvider>
            <div className="flex flex-col h-screen">
              <Nav />
              <div
                className="w-full flex"
                style={{ height: "calc(100vh - 46px)" }}
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
