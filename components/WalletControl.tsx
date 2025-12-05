"use client";

import { useAccount, useDisconnect } from "wagmi";

/**
 * WalletControl - Displays connected wallet and disconnect button
 * Client-side only component for wallet session management
 */
export default function WalletControl() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected || !address) return null;

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleDisconnect = () => {
    disconnect();
    // Force full page reload to home after disconnection for a clean reset
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <button
      onClick={handleDisconnect}
      className="flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 bg-loss/10 hover:bg-loss/20 text-loss border border-loss/30 hover:border-loss/50 rounded-lg transition-all font-mono shadow-lg"
      title={`Disconnect ${address}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-loss animate-pulse shadow-lg shadow-loss/50"></div>
      <span>DISCONNECT</span>
      <span className="hidden sm:inline font-mono text-gray-400">({shortAddress})</span>
    </button>
  );
}
