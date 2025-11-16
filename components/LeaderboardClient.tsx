"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WalletControl from "@/components/WalletControl";

interface LeaderboardEntry {
  wallet_address: string;
  xp: number;
  streak: number;
  accuracy: number;
}

/**
 * Leaderboard Client - Display top users by XP
 */
export default function LeaderboardClient() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/leaderboard");
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.data.leaderboard || []);
      } else {
        setError(data.error || "Failed to fetch leaderboard");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Wallet Control */}
        <div className="flex justify-end mb-4">
          <WalletControl />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">🏆 Leaderboard</h1>
          <div className="w-16" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Loading leaderboard...</p>
          </div>
        )}

        {/* No Data */}
        {!isLoading && leaderboard.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-xl font-bold mb-2">No Leaderboard Data</p>
            <p className="text-gray-400">Be the first to start predicting!</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!isLoading && leaderboard.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold">Rank</th>
                    <th className="text-left py-4 px-6 font-bold">Wallet</th>
                    <th className="text-right py-4 px-6 font-bold">XP</th>
                    <th className="text-right py-4 px-6 font-bold">Streak</th>
                    <th className="text-right py-4 px-6 font-bold">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr
                      key={entry.wallet_address}
                      className="border-t border-gray-700 hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span
                          className={`font-bold text-lg ${
                            index === 0
                              ? "text-yellow-400"
                              : index === 1
                              ? "text-gray-300"
                              : index === 2
                              ? "text-orange-400"
                              : "text-gray-400"
                          }`}
                        >
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm">
                        {entry.wallet_address.slice(0, 6)}...{entry.wallet_address.slice(-4)}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-purple-400">
                        {entry.xp.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-orange-400">
                        {entry.streak}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-green-400">
                        {(entry.accuracy * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
