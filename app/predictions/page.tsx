"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";

type Prediction = {
  id: number;
  prediction_text: string;
  asset: string;
  asset_type?: string;
  raw_text?: string;
  direction?: string;
  reference_type?: string;
  created_price?: number | null;
  expiry_timestamp: string;
  betting_close: string;
  status: string;
  outcome_value?: string | null;
  resolved_price?: number | null;
  resolved_timestamp?: string | null;
  resolution_report?: any;
  sentiment_yes: number;
  sentiment_no: number;
  created_timestamp: string;
};

type TabType = "active" | "expired" | "resolved";

export default function PredictionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  // Fetch predictions based on active tab
  const fetchPredictions = async (type: TabType, silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const response = await fetch(`/api/predictions/all?type=${type}`);
      const data = await response.json();
      if (data.success) {
        setPredictions(data.predictions);
      } else {
        console.error("Failed to fetch predictions:", data.error);
        if (!silent) {
          setPredictions([]);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      if (!silent) {
        setPredictions([]);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // Fetch on mount and tab change
  useEffect(() => {
    fetchPredictions(activeTab);
  }, [activeTab]);

  // Silent auto-refresh every 30 seconds (no loading state)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPredictions(activeTab, true); // Silent refresh
    }, 30000); // Increased to 30 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
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
              <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse shadow-lg shadow-neon/50"></div>
              <span className="text-gray-400 text-xs font-mono tracking-wider">MARKET_OVERVIEW</span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-mono">ALL_PREDICTIONS</h1>
            <p className="text-gray-400 text-sm font-mono">{'>'} View active, expired, and resolved predictions</p>
          </div>
        </div>

        {/* Tabs - Terminal Style */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold font-mono transition-all border text-sm ${
              activeTab === "active"
                ? "bg-gradient-to-br from-neon to-neon/80 text-void-black border-neon/50 shadow-lg shadow-neon/20"
                : "bg-void-graphite text-gray-400 hover:text-white border-grail/20 hover:border-grail/40"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "active" ? "bg-void-black" : "bg-gray-500"}`}></div>
              <span>ACTIVE</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold font-mono transition-all border text-sm ${
              activeTab === "expired"
                ? "bg-gradient-to-br from-auric to-auric/80 text-void-black border-auric/50 shadow-lg shadow-auric/20"
                : "bg-void-graphite text-gray-400 hover:text-white border-grail/20 hover:border-grail/40"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "expired" ? "bg-void-black" : "bg-gray-500"}`}></div>
              <span>EXPIRED</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("resolved")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold font-mono transition-all border text-sm ${
              activeTab === "resolved"
                ? "bg-gradient-to-br from-profit to-profit/80 text-white border-profit/50 shadow-lg shadow-profit/20"
                : "bg-void-graphite text-gray-400 hover:text-white border-grail/20 hover:border-grail/40"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "resolved" ? "bg-white" : "bg-gray-500"}`}></div>
              <span>RESOLVED</span>
            </div>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-void-black border border-grail/30 rounded-lg p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-grail border-t-transparent mb-4"></div>
            <p className="text-gray-400 font-mono">LOADING_PREDICTIONS...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && predictions.length === 0 && (
          <div className="bg-void-black border border-grail/30 rounded-lg p-8 text-center">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-gray-400 font-mono">NO_{activeTab.toUpperCase()}_PREDICTIONS_FOUND</p>
          </div>
        )}

        {/* Predictions List */}
        {!isLoading && predictions.length > 0 && (
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.id} className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
                      <span className="text-gray-400 text-xs font-mono tracking-wider">PREDICTION_#{pred.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      pred.status === "pending" ? "bg-auric/20 text-auric border border-auric/30" :
                      pred.status === "resolved" ? "bg-profit/20 text-profit border border-profit/30" :
                      pred.status === "resolving" ? "bg-neon/20 text-neon border border-neon/30" :
                      "bg-gray-700 text-gray-300"
                    }`}>
                      {pred.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="bg-grail/20 text-grail-light border border-grail/40 px-3 py-1 rounded-lg text-sm font-bold font-mono">
                      {pred.asset}
                    </span>
                    {pred.asset_type && (
                      <span className="bg-void-graphite text-gray-400 border border-grail/20 px-2 py-1 rounded text-xs font-mono">
                        {pred.asset_type === "crypto" ? "₿_CRYPTO" : "📈_STOCK"}
                      </span>
                    )}
                    {pred.direction && (
                      <span className={`px-2 py-1 rounded text-xs font-bold font-mono border ${
                        pred.direction === "up" ? "bg-profit/20 text-profit border-profit/30" :
                        pred.direction === "down" ? "bg-loss/20 text-loss border-loss/30" :
                        "bg-gray-700 text-gray-300 border-gray-600"
                      }`}>
                        {pred.direction.toUpperCase()}
                      </span>
                    )}
                    {pred.reference_type && (
                      <span className="bg-grail/10 text-grail-light border border-grail/30 px-2 py-1 rounded text-xs font-mono">
                        REF:{pred.reference_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Prediction Text */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-grail"></div>
                    <span className="text-xs font-mono text-gray-500 uppercase">Question</span>
                  </div>
                  <p className="text-lg font-bold text-gray-200 font-mono">{pred.prediction_text}</p>
                </div>

                {/* Raw Text */}
                {pred.raw_text && (
                  <div className="bg-void-graphite/50 border border-grail/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-1 rounded-full bg-auric"></div>
                      <p className="text-xs text-gray-500 font-mono uppercase">Raw_Data</p>
                    </div>
                    <p className="text-sm text-gray-300 font-mono">{pred.raw_text}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-void-graphite/30 p-3 rounded-lg border border-grail/20">
                    <p className="text-gray-500 text-xs font-mono uppercase mb-1">Expiry</p>
                    <p className="text-gray-300 font-mono text-xs">{new Date(pred.expiry_timestamp).toLocaleString()}</p>
                  </div>
                  <div className="bg-void-graphite/30 p-3 rounded-lg border border-grail/20">
                    <p className="text-gray-500 text-xs font-mono uppercase mb-1">Betting_Close</p>
                    <p className="text-gray-300 font-mono text-xs">{new Date(pred.betting_close).toLocaleString()}</p>
                  </div>
                </div>


                {/* Resolved Info */}
                {pred.status === "resolved" && (
                  <div className="bg-void-graphite/50 border border-grail/20 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-gray-500 text-xs font-mono uppercase mb-1">Outcome</p>
                        <p className={`text-xl font-bold font-mono ${
                          pred.outcome_value === "YES" ? "text-profit" : "text-loss"
                        }`}>
                          {pred.outcome_value}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-mono uppercase mb-1">Resolved_Price</p>
                        <p className="text-xl font-bold text-white font-mono tabular-nums">
                          ${pred.resolved_price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {pred.resolved_timestamp && (
                      <p className="text-xs text-gray-500 font-mono">
                        RESOLVED: {new Date(pred.resolved_timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Created Price (Crypto) */}
                {pred.created_price && (
                  <div className="mb-4 bg-void-graphite/30 p-3 rounded-lg border border-grail/20">
                    <p className="text-gray-500 text-xs font-mono uppercase mb-1">Created_Price</p>
                    <p className="text-gray-300 font-mono tabular-nums">${pred.created_price.toFixed(2)}</p>
                  </div>
                )}

                {/* Sentiment Pool */}
                <div className="mb-4">
                  <p className="text-gray-500 text-xs font-mono uppercase mb-2">Sentiment_Pool</p>
                  <div className="flex gap-3">
                    <div className="bg-profit/10 border border-profit/30 px-3 py-1.5 rounded-lg">
                      <span className="text-profit font-mono font-bold">YES: {pred.sentiment_yes}</span>
                    </div>
                    <div className="bg-loss/10 border border-loss/30 px-3 py-1.5 rounded-lg">
                      <span className="text-loss font-mono font-bold">NO: {pred.sentiment_no}</span>
                    </div>
                  </div>
                </div>

                {/* Resolution Report */}
                {pred.resolution_report && (
                  <div>
                    <button
                      onClick={() => setExpandedReport(expandedReport === pred.id ? null : pred.id)}
                      className="bg-void-graphite hover:bg-grail/20 text-white font-bold font-mono py-2 px-4 rounded-lg transition-colors text-xs mb-2 border border-grail/30 hover:border-grail/50"
                    >
                      {expandedReport === pred.id ? "HIDE" : "VIEW"}_RESOLUTION_REPORT
                    </button>
                    {expandedReport === pred.id && (
                      <pre className="bg-void-graphite/50 border border-grail/20 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono">
                        {JSON.stringify(pred.resolution_report, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="mt-6 p-3 bg-void-black border border-grail/20 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"></div>
            <span className="text-xs text-gray-500 font-mono">AUTO_REFRESH: 30s</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
