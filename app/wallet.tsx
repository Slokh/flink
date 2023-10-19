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
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  zora,
  optimismGoerli,
} from "viem/chains";
import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { useTheme } from "next-themes";
import { AuthProvider } from "@/context/auth";
import { UserProvider } from "@/context/user";

const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, zora, optimismGoerli],
  [
    publicProvider(),
    alchemyProvider({ apiKey: "yG87D42RhqjjNl0dw7uHQX2X-jZNPMt4" }),
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
        <AuthProvider>
          <UserProvider>{children}</UserProvider>
        </AuthProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
