"use client";

/**
 * Profile page - Display user stats and recent predictions
 * TODO: Implement API integration for user profile data
 */
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import WalletConnectButton from "@/components/WalletConnectButton";

export default function ProfilePage() {
  const { user, isLoading, isConnected } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 block">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8">Profile</h1>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-400 mb-4">Connect your wallet to view profile</p>
            <WalletConnectButton />
          </div>
        )}

        {/* Loading State */}
        {isConnected && isLoading && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-400">Loading profile...</p>
          </div>
        )}

        {/* User Stats */}
        {isConnected && user && (
          <>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Stats</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">XP</p>
                  <p className="text-3xl font-bold text-purple-400">{user.xp}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Streak</p>
                  <p className="text-3xl font-bold text-orange-400">{user.streak} days</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Accuracy</p>
                  <p className="text-3xl font-bold text-green-400">{user.accuracy}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Free Credits</p>
                  <p className="text-3xl font-bold text-blue-400">{user.credits_balance}</p>
                </div>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Wallet</h2>
              <p className="text-gray-400 text-sm mb-2">Connected Wallet</p>
              <p className="font-mono text-lg break-all">{user.wallet_address}</p>
            </div>

            {/* Account Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Account</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Member Since:</span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated:</span>
                  <span>{new Date(user.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
