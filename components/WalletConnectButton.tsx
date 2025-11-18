"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useUser } from "@/lib/useUser";
import { useState, useEffect } from "react";

/**
 * Wallet connection button using RainbowKit
 * Automatically fetches and displays user profile after connection
 */
export default function WalletConnectButton() {
  const { user, isLoading, error, isConnected } = useUser();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="w-full grail-button text-white font-bold py-4 px-8 rounded-xl text-lg transition-all hover:scale-105"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="w-full bg-loss hover:bg-loss/80 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="w-full bg-void-graphite hover:bg-void-graphite/80 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all flex items-center justify-between"
                  >
                    <span className="font-mono">
                      {account.displayName}
                    </span>
                    {user && (
                      <span className="text-auric">
                        {user.real_credits_balance} Credits
                      </span>
                    )}
                  </button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
      {isConnected && isLoading && (
        <p className="text-sm text-gray-400">Loading profile...</p>
      )}
      {isConnected && error && (
        <p className="text-xs text-loss">Failed to load profile</p>
      )}
    </div>
  );
}
