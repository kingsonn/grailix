"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/useUser";
import WalletConnectButton from "@/components/WalletConnectButton";
import WalletControl from "@/components/WalletControl";
import Link from "next/link";

interface HistoryItem {
  id: number;
  prediction_text: string;
  asset: string;
  position: string;
  stake_credits: number;
  payout_credits: number | null;
  outcome_value: string | null;
  resolved_price: number | null;
  resolved_timestamp: string | null;
  resolution_report: string | null;
  expiry_timestamp: string;
  status: string;
}

export default function HistoryClient() {
  const { address, isConnected } = useAccount();
  const { user, isLoading: userLoading, refetch } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  // Auto-refresh user data when wallet account changes
  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
  }, [address, isConnected, refetch]);

  // Fetch user history
  const fetchHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/history?user_id=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.data.history || []);
      } else {
        setError(data.error || "Failed to fetch history");
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

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
          <h1 className="text-3xl font-bold">Prediction History</h1>
          <div className="w-16" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">Connect your wallet to view history</p>
            <WalletConnectButton />
          </div>
        )}

        {/* Loading State */}
        {isConnected && (userLoading || isLoading) && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Loading history...</p>
          </div>
        )}

        {/* No History */}
        {isConnected && !userLoading && !isLoading && history.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-xl font-bold mb-2">No Predictions Yet</p>
            <p className="text-gray-400 mb-6">Start predicting to see your history here.</p>
            <Link href="/predict" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-block">
              Start Predicting
            </Link>
          </div>
        )}

        {/* History List */}
        {isConnected && !userLoading && !isLoading && history.length > 0 && (
          <div className="space-y-4">
            {history.map((item) => {
              const isResolved = item.status === "resolved";
              const won = isResolved && item.outcome_value === item.position;
              const lost = isResolved && item.outcome_value !== item.position && item.position !== "SKIP";
              const skipped = item.position === "SKIP";

              return (
                <div key={item.id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {item.asset}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            item.position === "YES"
                              ? "bg-green-600 text-white"
                              : item.position === "NO"
                              ? "bg-red-600 text-white"
                              : "bg-gray-600 text-white"
                          }`}
                        >
                          {item.position}
                        </span>
                        {isResolved && (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              won
                                ? "bg-green-500 text-white"
                                : lost
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {won ? "WON" : lost ? "LOST" : skipped ? "SKIPPED" : "PENDING"}
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold">{item.prediction_text}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Stake</p>
                      <p className="text-xl font-bold">{item.stake_credits}</p>
                    </div>
                    {isResolved && (
                      <>
                        <div>
                          <p className="text-gray-400 text-sm">Payout</p>
                          <p className={`text-xl font-bold ${won ? "text-green-400" : ""}`}>
                            {item.payout_credits || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Outcome</p>
                          <p className="text-xl font-bold">{item.outcome_value}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Resolved Price</p>
                          <p className="text-xl font-bold">
                            {item.resolved_price ? `$${item.resolved_price.toFixed(2)}` : "N/A"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Expires: {new Date(item.expiry_timestamp).toLocaleString()}</p>
                    {isResolved && item.resolved_timestamp && (
                      <p>Resolved: {new Date(item.resolved_timestamp).toLocaleString()}</p>
                    )}
                  </div>

                  {/* Resolution Report */}
                  {isResolved && item.resolution_report && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedReport(expandedReport === item.id ? null : item.id)}
                        className="text-blue-400 hover:underline text-sm"
                      >
                        {expandedReport === item.id ? "Hide" : "Show"} Resolution Report
                      </button>
                      {expandedReport === item.id && (
                        <div className="mt-2 bg-gray-900 p-4 rounded-lg overflow-x-auto">
                          <pre className="text-xs text-gray-300">
                            {JSON.stringify(JSON.parse(item.resolution_report), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
