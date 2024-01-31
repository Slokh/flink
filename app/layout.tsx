import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import WalletProvider from "./wallet";
import { Nav } from "@/components/nav";
import { ChannelSidebar } from "@/components/channels/channel-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { StrictMode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	metadataBase: new URL("https://flink.fyi"),
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
		<StrictMode>
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
					<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
					<meta name="msapplication-TileColor" content="#000000" />
					<meta name="theme-color" content="#000000" />
					<script
						defer
						data-domain="flink.fyi"
						src="https://plausible.io/js/script.js"
					></script>
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
									<div className="flex flex-row w-full">
										{children}
										<ChannelSidebar />
									</div>
								</div>
							</div>
							<Toaster />
						</WalletProvider>
					</ThemeProvider>
				</body>
			</html>
		</StrictMode>
	);
}
