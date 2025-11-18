"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/useUser";
import WalletConnectButton from "@/components/WalletConnectButton";
import AppLayout from "@/components/AppLayout";

interface HistoryItem {
  id: number;
  prediction_text: string;
  asset: string;
  asset_type?: string;
  raw_text?: string;
  betting_close?: string;
  direction?: string;
  reference_type?: string;
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
  const router = useRouter();
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
              <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
              <span className="text-gray-400 text-xs font-mono tracking-wider">PREDICTION_HISTORY</span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-mono">YOUR_HISTORY</h1>
            <p className="text-gray-400 text-sm font-mono">{'>'} Track your prediction performance</p>
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

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="bg-void-black border border-grail/30 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-gray-400 mb-4 font-mono">CONNECT_WALLET_TO_VIEW_HISTORY</p>
            <WalletConnectButton />
          </div>
        )}

        {/* Loading State */}
        {isConnected && (userLoading || isLoading) && (
          <div className="bg-void-black border border-grail/30 rounded-lg p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-grail border-t-transparent mb-4"></div>
            <p className="text-gray-400 font-mono">LOADING_HISTORY...</p>
          </div>
        )}

        {/* No History */}
        {isConnected && !userLoading && !isLoading && history.length === 0 && (
          <div className="bg-void-black border border-grail/30 rounded-lg p-8 text-center">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-xl font-bold mb-2 font-mono">NO_PREDICTIONS_YET</p>
            <p className="text-gray-400 mb-6 font-mono text-sm">{'>'} Start predicting to see your history here</p>
            <button
              onClick={() => router.push("/predict")}
              className="bg-gradient-to-br from-neon to-neon/80 hover:from-neon/90 hover:to-neon/70 text-void-black font-bold font-mono py-3 px-6 rounded-lg transition-all inline-block border border-neon/50 shadow-lg shadow-neon/20"
            >
              START_PREDICTING
            </button>
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
                <div key={item.id} className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
                        <span className="text-gray-400 text-xs font-mono tracking-wider">PREDICTION_#{item.id}</span>
                      </div>
                      {isResolved && (
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                          won ? "bg-profit/20 text-profit border-profit/30" :
                          lost ? "bg-loss/20 text-loss border-loss/30" :
                          "bg-gray-700 text-gray-300 border-gray-600"
                        }`}>
                          {won ? "WON" : lost ? "LOST" : skipped ? "SKIPPED" : "PENDING"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-grail/20 text-grail-light border border-grail/40 px-3 py-1 rounded-lg text-sm font-bold font-mono">
                        {item.asset}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold font-mono border ${
                        item.position === "YES" ? "bg-profit/20 text-profit border-profit/30" :
                        item.position === "NO" ? "bg-loss/20 text-loss border-loss/30" :
                        "bg-gray-700 text-gray-300 border-gray-600"
                      }`}>
                        {item.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-1 rounded-full bg-grail"></div>
                      <span className="text-xs font-mono text-gray-500 uppercase">Question</span>
                    </div>
                    <p className="text-base font-semibold text-gray-200 font-mono">{item.prediction_text}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-void-graphite/30 p-3 rounded-lg border border-grail/20">
                      <p className="text-gray-500 text-xs font-mono uppercase mb-1">Stake</p>
                      <p className="text-lg font-bold font-mono tabular-nums">{item.stake_credits}</p>
                    </div>
                    {isResolved && (
                      <>
                        <div className="bg-void-graphite/30 p-3 rounded-lg border border-grail/20">
                          <p className="text-gray-500 text-xs font-mono uppercase mb-1">Payout</p>
                          <p className={`text-lg font-bold font-mono tabular-nums ${won ? "text-profit" : ""}`}>
                            {item.payout_credits || 0}
                          </p>
                        </div>
                        <div className="bg-void-graphite/30 p-3 rounded-lg border border-grail/20">
                          <p className="text-gray-500 text-xs font-mono uppercase mb-1">Outcome</p>
                          <p className="text-lg font-bold font-mono">{item.outcome_value}</p>
                        </div>
                        <div className="bg-void-graphite/30 p-3 rounded-lg border border-grail/20">
                          <p className="text-gray-500 text-xs font-mono uppercase mb-1">Resolved_Price</p>
                          <p className="text-lg font-bold font-mono tabular-nums">
                            {item.resolved_price ? `$${item.resolved_price.toFixed(2)}` : "N/A"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-gray-500 space-y-1 font-mono">
                    <p>EXPIRES: {new Date(item.expiry_timestamp).toLocaleString()}</p>
                    {isResolved && item.resolved_timestamp && (
                      <p>RESOLVED: {new Date(item.resolved_timestamp).toLocaleString()}</p>
                    )}
                  </div>

                  {/* Resolution Report */}
                  {isResolved && item.resolution_report && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedReport(expandedReport === item.id ? null : item.id)}
                        className="bg-void-graphite hover:bg-grail/20 text-white font-bold font-mono py-2 px-4 rounded-lg transition-colors text-xs border border-grail/30 hover:border-grail/50"
                      >
                        {expandedReport === item.id ? "HIDE" : "SHOW"}_RESOLUTION_REPORT
                      </button>
                      {expandedReport === item.id && (
                        <div className="mt-2 bg-void-graphite/50 border border-grail/20 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-xs text-gray-300 font-mono">
                            {JSON.stringify(JSON.parse(item.resolution_report), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
