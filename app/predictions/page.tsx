"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">All Predictions</h1>
          <p className="text-gray-400">View active, expired, and resolved predictions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-800 p-2 rounded-lg">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
              activeTab === "active"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Active Predictions
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
              activeTab === "expired"
                ? "bg-yellow-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Expired (Awaiting Resolution)
          </button>
          <button
            onClick={() => setActiveTab("resolved")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
              activeTab === "resolved"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Resolved Predictions
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Loading predictions...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && predictions.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-gray-400">No {activeTab} predictions found</p>
          </div>
        )}

        {/* Predictions List */}
        {!isLoading && predictions.length > 0 && (
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {pred.asset}
                    </span>
                    {pred.asset_type && (
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                        {pred.asset_type === "crypto" ? "₿ Crypto" : "📈 Stock"}
                      </span>
                    )}
                    {pred.direction && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        pred.direction === "up" ? "bg-green-700 text-green-200" :
                        pred.direction === "down" ? "bg-red-700 text-red-200" :
                        "bg-gray-700 text-gray-300"
                      }`}>
                        {pred.direction.toUpperCase()}
                      </span>
                    )}
                    {pred.reference_type && (
                      <span className="bg-purple-700 text-purple-200 px-2 py-1 rounded-full text-xs">
                        ref: {pred.reference_type}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-sm">ID: {pred.id}</span>
                </div>

                {/* Prediction Text */}
                <p className="text-xl font-bold mb-4">{pred.prediction_text}</p>

                {/* Raw Text */}
                {pred.raw_text && (
                  <div className="bg-gray-900 rounded p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Source:</p>
                    <p className="text-sm text-gray-300">{pred.raw_text}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Expiry:</p>
                    <p className="text-gray-300">{new Date(pred.expiry_timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Betting Close:</p>
                    <p className="text-gray-300">{new Date(pred.betting_close).toLocaleString()}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    pred.status === "pending" ? "bg-yellow-700 text-yellow-200" :
                    pred.status === "resolved" ? "bg-green-700 text-green-200" :
                    pred.status === "resolving" ? "bg-blue-700 text-blue-200" :
                    "bg-gray-700 text-gray-300"
                  }`}>
                    {pred.status.toUpperCase()}
                  </span>
                </div>

                {/* Resolved Info */}
                {pred.status === "resolved" && (
                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-gray-500 text-sm">Outcome:</p>
                        <p className={`text-lg font-bold ${
                          pred.outcome_value === "YES" ? "text-green-400" : "text-red-400"
                        }`}>
                          {pred.outcome_value}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Resolved Price:</p>
                        <p className="text-lg font-bold text-white">
                          ${pred.resolved_price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {pred.resolved_timestamp && (
                      <p className="text-xs text-gray-500">
                        Resolved: {new Date(pred.resolved_timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Created Price (Crypto) */}
                {pred.created_price && (
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Created Price:</p>
                    <p className="text-gray-300">${pred.created_price.toFixed(2)}</p>
                  </div>
                )}

                {/* Sentiment Pool */}
                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-2">Sentiment Pool:</p>
                  <div className="flex gap-4">
                    <span className="text-green-400">YES: {pred.sentiment_yes}</span>
                    <span className="text-red-400">NO: {pred.sentiment_no}</span>
                  </div>
                </div>

                {/* Resolution Report */}
                {pred.resolution_report && (
                  <div>
                    <button
                      onClick={() => setExpandedReport(expandedReport === pred.id ? null : pred.id)}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm mb-2"
                    >
                      {expandedReport === pred.id ? "Hide" : "View"} Resolution Report
                    </button>
                    {expandedReport === pred.id && (
                      <pre className="bg-gray-900 rounded p-4 overflow-x-auto text-xs text-gray-300">
                        {JSON.stringify(pred.resolution_report, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Auto-refreshing every 30 seconds
        </div>
      </div>
    </div>
  );
}
