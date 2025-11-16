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

  return (
    <button
      onClick={() => disconnect()}
      className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-md"
      title={`Disconnect ${address}`}
    >
      Disconnect ({shortAddress})
    </button>
  );
}
