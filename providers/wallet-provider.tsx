"use client";

import { ReactNode, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { getWalletClient, isWalletInitialized } from "@/lib/wallet/initWallet";

// Create QueryClient ONCE outside component to prevent re-initialization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * WalletProvider - Single source of truth for wagmi + RainbowKit
 * Initializes wallet client ONCE at app root using singleton pattern
 * Prevents "WalletConnect Core is already initialized" errors
 */
export default function WalletProvider({ children }: { children: ReactNode }) {
  const [wagmiConfig, setWagmiConfig] = useState<ReturnType<typeof getWalletClient> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize wallet client ONCE on mount
  useEffect(() => {
    // Prevent re-initialization
    if (isInitialized || isWalletInitialized()) {
      if (!wagmiConfig) {
        setWagmiConfig(getWalletClient());
      }
      return;
    }

    try {
      console.log('[WalletProvider] Initializing wallet client...');
      const client = getWalletClient();
      setWagmiConfig(client);
      setIsInitialized(true);
      console.log('[WalletProvider] Wallet client initialized successfully');
    } catch (error) {
      console.error('[WalletProvider] Failed to initialize wallet client:', error);
    }
  }, []); // Empty dependency array - run ONCE on mount

  // Show loading state while initializing
  if (!wagmiConfig) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-grail border-t-transparent mb-4"></div>
          <p className="text-grail-pale font-mono text-sm">Initializing wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
