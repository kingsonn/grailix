"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/useUser";
import WalletConnectButton from "@/components/WalletConnectButton";
import WalletControl from "@/components/WalletControl";
import Link from "next/link";

interface Prediction {
  id: number;
  prediction_text: string;
  asset: string;
  expiry_timestamp: string;
  sentiment_yes: number;
  sentiment_no: number;
}

export default function PredictClient() {
  const { address, isConnected } = useAccount();
  const { user, isLoading: userLoading, refetch } = useUser();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<"YES" | "NO" | "SKIP" | null>(null);
  const [stakeAmount, setStakeAmount] = useState(10);

  // Auto-refresh user data when wallet account changes
  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
  }, [address, isConnected, refetch]);

  // Fetch next prediction
  const fetchNextPrediction = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/predictions/next?user_wallet_address=${user.wallet_address}`);
      const data = await response.json();

      if (data.success) {
        setPrediction(data.data.prediction);
      } else {
        setError(data.error || "Failed to fetch prediction");
      }
    } catch (err) {
      console.error("Error fetching prediction:", err);
      setError("Failed to load prediction");
    } finally {
      setIsLoading(false);
    }
  };

  // Load prediction on mount
  useEffect(() => {
    if (user) {
      fetchNextPrediction();
    }
  }, [user]);

  // Handle stake submission
  const handleStake = async () => {
    if (!user || !prediction || !selectedPosition) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/predictions/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          prediction_id: prediction.id,
          position: selectedPosition,
          stake_credits: selectedPosition === "SKIP" ? 0 : stakeAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Close modal and load next prediction
        setShowStakeModal(false);
        setSelectedPosition(null);
        fetchNextPrediction();
      } else {
        setError(data.error || "Failed to submit stake");
      }
    } catch (err) {
      console.error("Error submitting stake:", err);
      setError("Failed to submit stake");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Yes/No button click
  const handlePositionClick = (position: "YES" | "NO") => {
    setSelectedPosition(position);
    setShowStakeModal(true);
  };

  // Handle Skip
  const handleSkip = async () => {
    if (!user || !prediction) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/predictions/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          prediction_id: prediction.id,
          position: "SKIP",
          stake_credits: 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchNextPrediction();
      } else {
        setError(data.error || "Failed to skip");
      }
    } catch (err) {
      console.error("Error skipping:", err);
      setError("Failed to skip");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate sentiment percentages
  const totalVotes = prediction ? prediction.sentiment_yes + prediction.sentiment_no : 0;
  const yesPercent = totalVotes > 0 ? Math.round((prediction!.sentiment_yes / totalVotes) * 100) : 50;
  const noPercent = totalVotes > 0 ? Math.round((prediction!.sentiment_no / totalVotes) * 100) : 50;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Wallet Control */}
        <div className="flex justify-end mb-4">
          <WalletControl />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">Predictions</h1>
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
            <p className="text-gray-400 mb-4">Connect your wallet to start predicting</p>
            <WalletConnectButton />
          </div>
        )}

        {/* Loading State */}
        {isConnected && (userLoading || isLoading) && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        )}

        {/* No Predictions Available */}
        {isConnected && !userLoading && !isLoading && !prediction && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-2xl mb-4">🎉</p>
            <p className="text-xl font-bold mb-2">All Caught Up!</p>
            <p className="text-gray-400 mb-6">No more predictions available right now.</p>
            <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-block">
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Prediction Card */}
        {isConnected && user && prediction && !isLoading && (
          <>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
              {/* Asset Badge */}
              <div className="flex justify-between items-center mb-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {prediction.asset}
                </span>
                <span className="text-gray-400 text-sm">
                  Expires: {new Date(prediction.expiry_timestamp).toLocaleString()}
                </span>
              </div>

              {/* Prediction Text */}
              <p className="text-2xl font-bold mb-6 text-center">{prediction.prediction_text}</p>

              {/* Sentiment Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400">YES {yesPercent}%</span>
                  <span className="text-gray-400">{totalVotes} votes</span>
                  <span className="text-red-400">NO {noPercent}%</span>
                </div>
                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500 transition-all duration-300"
                    style={{ width: `${yesPercent}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all duration-300"
                    style={{ width: `${noPercent}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handlePositionClick("YES")}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors"
                >
                  YES
                </button>
                <button
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-bold py-4 rounded-lg transition-colors"
                >
                  SKIP
                </button>
                <button
                  onClick={() => handlePositionClick("NO")}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors"
                >
                  NO
                </button>
              </div>

              {/* User Balance */}
              <div className="mt-4 text-center text-sm text-gray-400">
                Your Balance: {user.credits_balance} credits
              </div>
            </div>
          </>
        )}

        {/* Stake Modal */}
        {showStakeModal && selectedPosition && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Select Stake Amount</h2>
              <p className="text-gray-400 mb-4">
                Position: <span className={selectedPosition === "YES" ? "text-green-400" : "text-red-400"}>{selectedPosition}</span>
              </p>
              <p className="text-gray-400 mb-4">Your Balance: {user?.credits_balance} credits</p>

              {/* Stake Options */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[10, 20, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setStakeAmount(amount)}
                    disabled={user && user.credits_balance < amount}
                    className={`py-3 rounded-lg font-bold transition-colors ${
                      stakeAmount === amount
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    } ${user && user.credits_balance < amount ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {/* Confirm/Cancel */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStakeModal(false);
                    setSelectedPosition(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStake}
                  disabled={isLoading || (user && user.credits_balance < stakeAmount)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
