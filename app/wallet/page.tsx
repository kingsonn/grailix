"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/useUser";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { v4 as uuidv4 } from "uuid";
import { VAULT_ADDRESS, TOKEN_ADDRESS, MockUSDC_ABI, GrailixVault_ABI } from "@/lib/contract";
import WalletConnectButton from "@/components/WalletConnectButton";
import Link from "next/link";

/**
 * Wallet page - Manage deposits and withdrawals
 * TODO: Implement wallet functionality with smart contract integration
 */
export default function WalletPage() {
  const { user, isLoading, isConnected, refetch } = useUser();
  const { address } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isDepositing, isSuccess: isDeposited } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const handleDeposit = async () => {
    if (!address || !depositAmount || !user) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatusMessage({ type: "error", text: "Invalid amount" });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Step 1/3: Approving MockUSDC..." });

    try {
      const amountWei = parseUnits(amount.toString(), 18);
      const internalDepositId = uuidv4();

      // Step 1: Approve MockUSDC
      writeApprove({
        address: TOKEN_ADDRESS,
        abi: MockUSDC_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, amountWei],
      });

      // Wait for approval (handled by useWaitForTransactionReceipt)
      // Then proceed to deposit in useEffect
    } catch (error) {
      console.error("Deposit error:", error);
      setStatusMessage({ type: "error", text: "Approval failed" });
      setIsProcessing(false);
    }
  };

  // Handle approval success -> trigger deposit
  useEffect(() => {
    if (isApproved && !isDepositing && !isDeposited) {
      setStatusMessage({ type: "info", text: "Step 2/3: Depositing to vault..." });
      const amount = parseFloat(depositAmount);
      const amountWei = parseUnits(amount.toString(), 18);
      const internalDepositId = uuidv4();

      writeDeposit({
        address: VAULT_ADDRESS,
        abi: GrailixVault_ABI,
        functionName: "deposit",
        args: [amountWei, internalDepositId],
      });
    }
  }, [isApproved]);

  // Handle deposit success -> call backend API
  useEffect(() => {
    if (isDeposited && depositHash) {
      setStatusMessage({ type: "info", text: "Step 3/3: Recording deposit..." });
      const amount = parseFloat(depositAmount);
      const internalDepositId = uuidv4();

      fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          amount: amount,
          tx_hash: depositHash,
          internal_deposit_id: internalDepositId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStatusMessage({ type: "success", text: `Deposited ${amount} MockUSDC successfully!` });
            setDepositAmount("");
            refetch(); // Refresh user balance
          } else {
            setStatusMessage({ type: "error", text: data.error || "Failed to record deposit" });
          }
        })
        .catch((error) => {
          console.error("Backend deposit error:", error);
          setStatusMessage({ type: "error", text: "Failed to record deposit" });
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  }, [isDeposited, depositHash]);

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount || !user) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatusMessage({ type: "error", text: "Invalid amount" });
      return;
    }

    if (amount > user.real_credits_balance) {
      setStatusMessage({ type: "error", text: "Insufficient funds" });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Processing withdrawal..." });

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: "success", text: `Withdrawn ${amount} MockUSDC successfully!` });
        setWithdrawAmount("");
        refetch(); // Refresh user balance
      } else {
        setStatusMessage({ type: "error", text: data.error || "Withdrawal failed" });
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      setStatusMessage({ type: "error", text: "Withdrawal failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <div className="w-16" />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              statusMessage.type === "success"
                ? "bg-green-900 bg-opacity-50 border border-green-500 text-green-200"
                : statusMessage.type === "error"
                ? "bg-red-900 bg-opacity-50 border border-red-500 text-red-200"
                : "bg-blue-900 bg-opacity-50 border border-blue-500 text-blue-200"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">Connect your wallet to manage funds</p>
            <WalletConnectButton />
          </div>
        )}

        {/* Loading State */}
        {isConnected && isLoading && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Loading wallet data...</p>
          </div>
        )}

        {/* Balance Display */}
        {isConnected && user && (
          <>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Your Balance</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Free Credits:</span>
                  <span className="text-2xl font-bold text-green-400">
                    {user.credits_balance}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Real Credits:</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {user.real_credits_balance}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Wallet: {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
              </p>
            </div>

            {/* Deposit Section */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Deposit</h2>
              <p className="text-sm text-gray-400 mb-4">
                Deposit MockUSDC to get real credits (1:1 ratio)
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleDeposit}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  Deposit
                </button>
              </div>
            </div>

            {/* Withdraw Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Withdraw</h2>
              <p className="text-sm text-gray-400 mb-4">
                Withdraw your real credits back to MockUSDC
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={isProcessing || !user || user.real_credits_balance === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
