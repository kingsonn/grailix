"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/useUser";
import PredictionCard from "@/components/PredictionCard";
import StakeSelector from "@/components/StakeSelector";
import WalletConnectButton from "@/components/WalletConnectButton";
import Link from "next/link";
import type { Prediction } from "@/types/supabase";

export default function SwipePage() {
  const { user, isLoading: userLoading, isConnected, address } = useUser();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStakeSelector, setShowStakeSelector] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<"YES" | "NO" | null>(null);

  // Fetch next prediction when user connects
  useEffect(() => {
    if (isConnected && address && !userLoading) {
      fetchNextPrediction();
    }
  }, [isConnected, address, userLoading]);

  const fetchNextPrediction = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/predictions/next?user_wallet_address=${address}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to fetch prediction");
        return;
      }

      setPrediction(data.data.prediction);
    } catch (err) {
      console.error("Error fetching prediction:", err);
      setError("Failed to load prediction");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (position: "YES" | "NO" | "SKIP") => {
    if (!user || !prediction || !address) return;

    // For YES/NO, show stake selector
    if (position === "YES" || position === "NO") {
      setPendingPosition(position);
      setShowStakeSelector(true);
      return;
    }

    // For SKIP, immediately submit
    await submitStake(position, 0);
  };

  const handleStakeSelect = async (stakeAmount: number) => {
    if (!pendingPosition) return;
    setShowStakeSelector(false);
    await submitStake(pendingPosition, stakeAmount);
    setPendingPosition(null);
  };

  const handleStakeCancel = () => {
    setShowStakeSelector(false);
    setPendingPosition(null);
  };

  const submitStake = async (position: "YES" | "NO" | "SKIP", stakeCredits: number) => {
    if (!user || !prediction || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/predictions/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          prediction_id: prediction.id,
          position: position,
          stake_credits: stakeCredits,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to submit stake");
        setIsLoading(false);
        return;
      }

      // Update user balance in React Query cache
      // This will be reflected automatically via useUser hook

      // Load next prediction
      await fetchNextPrediction();
    } catch (err) {
      console.error("Error submitting stake:", err);
      setError("Failed to submit stake");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">Swipe</h1>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">Connect your wallet to start swiping</p>
            <WalletConnectButton />
          </div>
        )}

        {/* Loading State */}
        {isConnected && (userLoading || isLoading) && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Loading predictions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-4">
            <p className="text-red-200">{error}</p>
            <button
              onClick={fetchNextPrediction}
              className="mt-2 text-sm text-red-300 hover:text-red-100 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* No Predictions */}
        {isConnected && !userLoading && !isLoading && !prediction && !error && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-2xl mb-4">🎉</p>
            <p className="text-xl font-semibold mb-2">All caught up!</p>
            <p className="text-gray-400 mb-4">No more predictions available right now.</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Go Home
            </Link>
          </div>
        )}

        {/* Prediction Card */}
        {isConnected && !userLoading && !isLoading && prediction && (
          <>
            <PredictionCard prediction={prediction} onSwipe={handleSwipe} />

            {/* User Balance */}
           
          </>
        )}

        {/* Stake Selector Modal */}
        {showStakeSelector && user && (
          <StakeSelector
            onSelect={handleStakeSelect}
            onCancel={handleStakeCancel}
            userBalance={user.real_credits_balance}
          />
        )}
      </div>
    </div>
  );
}
