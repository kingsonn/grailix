"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/useUser";
import WalletConnectButton from "@/components/WalletConnectButton";
import WalletControl from "@/components/WalletControl";

export default function HomeClient() {
  const { address, isConnected } = useAccount();
  const { user, isLoading, refetch } = useUser();

  // Auto-refresh user data when wallet account changes
  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
  }, [address, isConnected, refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Wallet Control */}
        <div className="flex justify-end mb-4">
          <WalletControl />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">Grailix</h1>
          <p className="text-gray-400 text-lg">AI-Powered Prediction Platform</p>
        </div>

        {/* Wallet Connect */}
        {!isConnected && (
          <div className="bg-gray-800 rounded-lg p-8 text-center mb-8">
            <p className="text-gray-400 mb-4">Connect your wallet to start predicting</p>
            <WalletConnectButton />
          </div>
        )}

        {/* Loading State */}
        {isConnected && isLoading && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Loading your data...</p>
          </div>
        )}

        {/* User Dashboard */}
        {isConnected && user && (
          <>
            {/* User Stats Card */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Your Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Free Credits</p>
                  <p className="text-3xl font-bold text-green-400">{user.credits_balance}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Real Credits</p>
                  <p className="text-3xl font-bold text-blue-400">{user.real_credits_balance}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">XP</p>
                  <p className="text-3xl font-bold text-purple-400">{user.xp}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Streak</p>
                  <p className="text-3xl font-bold text-orange-400">{user.streak}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Accuracy</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {(user.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Wallet</p>
                  <p className="text-sm font-mono text-gray-300">
                    {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/predict"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-lg transition-colors text-center text-xl shadow-lg"
              >
                🎯 Start Predicting
              </Link>
              <Link
                href="/wallet"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-8 rounded-lg transition-colors text-center text-xl shadow-lg"
              >
                💰 Wallet
              </Link>
              <Link
                href="/history"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-6 px-8 rounded-lg transition-colors text-center text-xl shadow-lg"
              >
                📜 History
              </Link>
              <Link
                href="/leaderboard"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 px-8 rounded-lg transition-colors text-center text-xl shadow-lg"
              >
                🏆 Leaderboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
