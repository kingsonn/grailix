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
    <div className="flex flex-col items-center gap-2">
      <ConnectButton />
      {isConnected && isLoading && (
        <p className="text-sm text-gray-400">Loading profile...</p>
      )}
      {isConnected && user && (
        <p className="text-xs text-green-400">
          Credits: {user.credits_balance} | XP: {user.xp}
        </p>
      )}
      {isConnected && error && (
        <p className="text-xs text-red-400">Failed to load profile</p>
      )}
    </div>
  );
}
