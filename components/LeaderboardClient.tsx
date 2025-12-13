"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import AppLayout from "@/components/AppLayout";

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
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; entry: LeaderboardEntry } | null>(null);
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
        const leaderboardData = data.data.leaderboard || [];
        setLeaderboard(leaderboardData);
        
        // Find user's rank if connected
        if (isConnected && address) {
          const userIndex = leaderboardData.findIndex(
            (entry: LeaderboardEntry) => entry.wallet_address.toLowerCase() === address.toLowerCase()
          );
          if (userIndex !== -1) {
            setUserRank({ rank: userIndex + 1, entry: leaderboardData[userIndex] });
          } else {
            // User not in top 50, fetch their rank separately
            fetchUserRank();
          }
        }
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

  // Fetch user's rank if not in top 50
  const fetchUserRank = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/leaderboard/user-rank?wallet=${address}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setUserRank({ rank: data.data.rank, entry: data.data.entry });
      }
    } catch (err) {
      console.error("Error fetching user rank:", err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-mono text-sm group"
        >
          <div className="w-6 h-6 rounded border border-grail/30 group-hover:border-grail/60 flex items-center justify-center transition-colors">
            <span className="text-xs">←</span>
          </div>
          <span>BACK_TO_DASHBOARD</span>
        </button>

        {/* Header */}
        <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl mb-6">
          <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-auric animate-pulse shadow-lg shadow-auric/50"></div>
              <span className="text-gray-400 text-xs font-mono tracking-wider">LEADERBOARD</span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-mono">🏆 TOP_PREDICTORS</h1>
            <p className="text-gray-400 text-sm font-mono">{'>'} Rankings based on XP and performance</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-loss/10 border border-loss text-loss p-4 rounded-lg mb-6 font-mono text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-loss animate-pulse"></div>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-void-black border border-grail/30 rounded-lg p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-grail border-t-transparent mb-4"></div>
            <p className="text-gray-400 font-mono">LOADING_LEADERBOARD...</p>
          </div>
        )}

        {/* No Data */}
        {!isLoading && leaderboard.length === 0 && (
          <div className="bg-void-black border border-grail/30 rounded-lg p-8 text-center">
            <p className="text-5xl mb-4">🏆</p>
            <p className="text-xl font-bold mb-2 font-mono">NO_LEADERBOARD_DATA</p>
            <p className="text-gray-400 font-mono text-sm">{'>'} Be the first to start predicting!</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!isLoading && leaderboard.length > 0 && (
          <div className="bg-void-black border border-grail/30 rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-auric animate-pulse shadow-lg shadow-auric/50"></div>
                <span className="text-gray-400 text-xs font-mono tracking-wider">RANKINGS</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-void-graphite/50 border-b border-grail/20">
                  <tr>
                    <th className="text-left py-3 px-4 sm:px-6 font-bold font-mono text-xs text-gray-400 uppercase">Rank</th>
                    <th className="text-left py-3 px-4 sm:px-6 font-bold font-mono text-xs text-gray-400 uppercase">Wallet</th>
                    <th className="text-right py-3 px-4 sm:px-6 font-bold font-mono text-xs text-gray-400 uppercase">XP</th>
                    <th className="text-right py-3 px-4 sm:px-6 font-bold font-mono text-xs text-gray-400 uppercase">Streak</th>
                    <th className="text-right py-3 px-4 sm:px-6 font-bold font-mono text-xs text-gray-400 uppercase">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = isConnected && address && entry.wallet_address.toLowerCase() === address.toLowerCase();
                    return (
                      <tr
                        key={entry.wallet_address}
                        className={`border-t transition-colors ${
                          isCurrentUser 
                            ? "bg-gradient-to-r from-grail/20 via-grail/10 to-grail/20 border-grail/40 shadow-[0_0_15px_rgba(125,44,255,0.2)]" 
                            : "border-grail/20 hover:bg-void-graphite/30"
                        }`}
                      >
                        <td className="py-3 px-4 sm:px-6">
                          <span
                            className={`font-bold text-base font-mono ${
                              index === 0
                                ? "text-auric drop-shadow-[0_0_8px_rgba(232,197,71,0.6)]"
                                : index === 1
                                ? "text-gray-300"
                                : index === 2
                                ? "text-orange-400"
                                : isCurrentUser
                                ? "text-grail-light"
                                : "text-gray-400"
                            }`}
                          >
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 sm:px-6 font-mono text-xs sm:text-sm">
                          <span className={isCurrentUser ? "text-white font-bold" : "text-gray-300"}>
                            {entry.wallet_address.slice(0, 6)}...{entry.wallet_address.slice(-4)}
                          </span>
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] bg-grail/30 text-grail-light px-1.5 py-0.5 rounded font-bold">YOU</span>
                          )}
                        </td>
                        <td className={`py-3 px-4 sm:px-6 text-right font-bold font-mono tabular-nums ${isCurrentUser ? "text-grail-light drop-shadow-[0_0_6px_rgba(166,108,255,0.5)]" : "text-grail-light"}`}>
                          {entry.xp.toLocaleString()}
                        </td>
                        <td className={`py-3 px-4 sm:px-6 text-right font-bold font-mono tabular-nums ${isCurrentUser ? "text-auric drop-shadow-[0_0_6px_rgba(232,197,71,0.5)]" : "text-auric"}`}>
                          {entry.streak}
                        </td>
                        <td className={`py-3 px-4 sm:px-6 text-right font-bold font-mono tabular-nums ${isCurrentUser ? "text-profit drop-shadow-[0_0_6px_rgba(0,217,139,0.5)]" : "text-profit"}`}>
                          {(entry.accuracy).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* User's rank if not in top 50 */}
                  {userRank && userRank.rank > 50 && (
                    <>
                      {/* Separator */}
                      <tr className="border-t border-grail/30">
                        <td colSpan={5} className="py-2 text-center">
                          <span className="text-gray-500 text-xs font-mono">• • •</span>
                        </td>
                      </tr>
                      {/* User's row */}
                      <tr className="border-t bg-gradient-to-r from-grail/20 via-grail/10 to-grail/20 border-grail/40 shadow-[0_0_15px_rgba(125,44,255,0.2)]">
                        <td className="py-3 px-4 sm:px-6">
                          <span className="font-bold text-base font-mono text-grail-light">
                            #{userRank.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4 sm:px-6 font-mono text-xs sm:text-sm">
                          <span className="text-white font-bold">
                            {userRank.entry.wallet_address.slice(0, 6)}...{userRank.entry.wallet_address.slice(-4)}
                          </span>
                          <span className="ml-2 text-[10px] bg-grail/30 text-grail-light px-1.5 py-0.5 rounded font-bold">YOU</span>
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right font-bold font-mono tabular-nums text-grail-light drop-shadow-[0_0_6px_rgba(166,108,255,0.5)]">
                          {userRank.entry.xp.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right font-bold font-mono tabular-nums text-auric drop-shadow-[0_0_6px_rgba(232,197,71,0.5)]">
                          {userRank.entry.streak}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right font-bold font-mono tabular-nums text-profit drop-shadow-[0_0_6px_rgba(0,217,139,0.5)]">
                          {(userRank.entry.accuracy).toFixed(1)}%
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
