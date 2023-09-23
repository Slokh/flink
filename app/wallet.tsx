"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import {
  rainbowWallet,
  walletConnectWallet,
  metaMaskWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base, zora } from "viem/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { useTheme } from "next-themes";
import { UserProvider } from "@/context/user";

const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, zora],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID as string }),
    publicProvider(),
  ]
);

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      metaMaskWallet({ projectId: "502257870646298f5289fef1a3ae41ed", chains }),
      coinbaseWallet({ appName: "flink", chains }),
      rainbowWallet({
        projectId: "502257870646298f5289fef1a3ae41ed",
        chains,
      }),
      walletConnectWallet({
        projectId: "502257870646298f5289fef1a3ae41ed",
        chains,
      }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        modalSize="compact"
        chains={chains}
        theme={
          resolvedTheme === "dark"
            ? darkTheme({
                accentColor: "white",
                accentColorForeground: "black",
              })
            : lightTheme({
                accentColor: "black",
                accentColorForeground: "white",
              })
        }
      >
        <UserProvider>{children}</UserProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
