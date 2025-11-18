"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { MockUSDC_ABI, TOKEN_ADDRESS } from "@/lib/contract";

/**
 * Claim 100 MockUSDC Button
 * Calls the faucet function on MockUSDC contract
 */
export default function ClaimFaucetButton() {
  const { address, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleClaim = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!TOKEN_ADDRESS) {
      alert("MockUSDC contract address not configured");
      return;
    }

    try {
      setIsProcessing(true);

      // Call faucet function with 100 * 10^18
      const amount = parseUnits("100", 18);

      writeContract({
        address: TOKEN_ADDRESS,
        abi: MockUSDC_ABI,
        functionName: "faucet",
        args: [amount],
      });
    } catch (err) {
      console.error("Faucet claim error:", err);
      alert("Failed to claim tokens. Check console for details.");
      setIsProcessing(false);
    }
  };

  // Reset processing state when transaction is confirmed or fails
  if (isSuccess && isProcessing) {
    setIsProcessing(false);
    setTimeout(() => {
      alert("✅ Successfully claimed 100 MockUSDC!");
    }, 100);
  }

  if (error && isProcessing) {
    setIsProcessing(false);
  }

  const buttonDisabled = !isConnected || isPending || isConfirming || isProcessing;

  return (
    <button
      onClick={handleClaim}
      disabled={buttonDisabled}
      className="group bg-gradient-to-br from-void-graphite to-profit/5 hover:from-profit/10 hover:to-profit/20 border border-profit/20 hover:border-profit/50 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-profit/20 disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      <div className="text-center">
        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
          {isPending || isConfirming ? "⏳" : isSuccess ? "✅" : "💰"}
        </div>
        <p className="text-xs font-mono font-bold text-gray-400 group-hover:text-profit transition-colors uppercase tracking-wider">
          {isPending
            ? "Confirming..."
            : isConfirming
            ? "Processing..."
            : isSuccess
            ? "Claimed!"
            : "Claim 100 USDC"}
        </p>
      </div>
    </button>
  );
}
