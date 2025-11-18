"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/useUser";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { v4 as uuidv4 } from "uuid";
import { VAULT_ADDRESS, TOKEN_ADDRESS, MockUSDC_ABI, GrailixVault_ABI } from "@/lib/contract";
import WalletConnectButton from "@/components/WalletConnectButton";
import AppLayout from "@/components/AppLayout";

export default function WalletClient() {
  const { address, isConnected } = useAccount();
  const { user, isLoading, refetch } = useUser();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
  }, [address, isConnected, refetch]);

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
    setStatusMessage({ type: "info", text: "Step 1/3: Approving tokens..." });

    try {
      const amountInWei = parseUnits(depositAmount, 18);

      writeApprove({
        address: TOKEN_ADDRESS,
        abi: MockUSDC_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, amountInWei],
      });
    } catch (error: any) {
      console.error("Approval error:", error);
      setStatusMessage({ type: "error", text: error.message || "Approval failed" });
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isApproved && !isDepositing && !isDeposited) {
      setStatusMessage({ type: "info", text: "Step 2/3: Depositing to vault..." });

      const amountInWei = parseUnits(depositAmount, 18);
      const internalDepositId = uuidv4();

      writeDeposit({
        address: VAULT_ADDRESS,
        abi: GrailixVault_ABI,
        functionName: "deposit",
        args: [amountInWei, internalDepositId],
      });
    }
  }, [isApproved]);

  useEffect(() => {
    if (isDeposited) {
      setStatusMessage({ type: "info", text: "Step 3/3: Updating balance..." });

      const finalizeDeposit = async () => {
        try {
          const response = await fetch("/api/wallet/deposit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              wallet_address: address,
              amount: parseFloat(depositAmount),
              tx_hash: depositHash,
            }),
          });

          const data = await response.json();

          if (data.success) {
            setStatusMessage({ type: "success", text: `Successfully deposited ${depositAmount} MockUSDC!` });
            setDepositAmount("");
            refetch();
          } else {
            setStatusMessage({ type: "error", text: data.error || "Failed to update balance" });
          }
        } catch (error: any) {
          setStatusMessage({ type: "error", text: "Failed to finalize deposit" });
        } finally {
          setIsProcessing(false);
        }
      };

      finalizeDeposit();
    }
  }, [isDeposited]);

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount || !user) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatusMessage({ type: "error", text: "Invalid amount" });
      return;
    }

    if (amount > user.real_credits_balance) {
      setStatusMessage({ type: "error", text: "Insufficient balance" });
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
        setStatusMessage({ type: "success", text: `Withdrawal request submitted! ${amount} MockUSDC` });
        setWithdrawAmount("");
        refetch();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Withdrawal failed" });
      }
    } catch (error: any) {
      setStatusMessage({ type: "error", text: "Failed to process withdrawal" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {!isConnected && (
          <div className="grail-glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to manage your funds
            </p>
            <WalletConnectButton />
          </div>
        )}

        {isConnected && user && (
          <div className="fade-in">
            {/* Balance Card */}
            <div className="grail-glass rounded-3xl p-8 mb-8">
              <div className="text-center mb-8">
                <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Balance</p>
                <h1 className="text-6xl font-black text-auric mb-2">{user.real_credits_balance}</h1>
                <p className="text-gray-500 text-sm">MockUSDC Credits</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-void-graphite rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs uppercase mb-1">XP</p>
                  <p className="text-2xl font-bold text-grail-light">{user.xp}</p>
                </div>
                <div className="bg-void-graphite rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs uppercase mb-1">Streak</p>
                  <p className="text-2xl font-bold text-neon">{user.streak} days</p>
                </div>
                <div className="bg-void-graphite rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs uppercase mb-1">Accuracy</p>
                  <p className={`text-2xl font-bold ${user.accuracy >= 0.5 ? 'profit-text' : 'loss-text'}`}>
                    {(user.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`
                  flex-1 py-4 rounded-xl font-bold transition-all
                  ${activeTab === "deposit" 
                    ? "bg-grail-gradient text-white shadow-grail" 
                    : "bg-void-graphite text-gray-400 hover:text-white"
                  }
                `}
              >
                💳 Deposit
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`
                  flex-1 py-4 rounded-xl font-bold transition-all
                  ${activeTab === "withdraw" 
                    ? "bg-grail-gradient text-white shadow-grail" 
                    : "bg-void-graphite text-gray-400 hover:text-white"
                  }
                `}
              >
                💸 Withdraw
              </button>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className={`
                rounded-xl p-4 mb-6 border
                ${statusMessage.type === "success" ? "bg-profit/10 border-profit text-profit" : ""}
                ${statusMessage.type === "error" ? "bg-loss/10 border-loss text-loss" : ""}
                ${statusMessage.type === "info" ? "bg-neon/10 border-neon text-neon" : ""}
              `}>
                {statusMessage.text}
              </div>
            )}

            {/* Deposit Tab */}
            {activeTab === "deposit" && (
              <div className="grail-card rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6">Deposit MockUSDC</h2>
                
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Amount</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-void-graphite border border-grail/30 rounded-xl px-6 py-4 text-white text-2xl font-bold focus:outline-none focus:border-grail"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[10, 50, 100, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="bg-void-graphite hover:bg-grail/20 text-white py-3 rounded-lg font-bold transition-all"
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="w-full auric-button font-bold py-5 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Deposit"}
                </button>

                <div className="mt-6 p-4 bg-void-graphite/50 rounded-lg">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    💡 <strong>How it works:</strong> Deposits are processed in 3 steps: 
                    (1) Approve tokens, (2) Deposit to vault, (3) Update balance. 
                    This ensures maximum security for your funds.
                  </p>
                </div>
              </div>
            )}

            {/* Withdraw Tab */}
            {activeTab === "withdraw" && (
              <div className="grail-card rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6">Withdraw MockUSDC</h2>
                
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Amount</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    max={user.real_credits_balance}
                    className="w-full bg-void-graphite border border-grail/30 rounded-xl px-6 py-4 text-white text-2xl font-bold focus:outline-none focus:border-grail"
                  />
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-gray-500">Min: 1</span>
                    <span className="text-gray-400">
                      Available: <span className="text-auric font-bold">{user.real_credits_balance}</span>
                    </span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {[10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setWithdrawAmount(amount.toString())}
                      disabled={amount > user.real_credits_balance}
                      className="bg-void-graphite hover:bg-grail/20 disabled:opacity-30 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-all"
                    >
                      {amount}
                    </button>
                  ))}
                  <button
                    onClick={() => setWithdrawAmount(user.real_credits_balance.toString())}
                    className="bg-void-graphite hover:bg-grail/20 text-white py-3 rounded-lg font-bold transition-all"
                  >
                    MAX
                  </button>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > user.real_credits_balance}
                  className="w-full neon-button font-bold py-5 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Withdraw"}
                </button>

                <div className="mt-6 p-4 bg-void-graphite/50 rounded-lg">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    ⚠️ <strong>Important:</strong> Withdrawals are processed by our smart contract. 
                    Funds will be sent to your connected wallet address. 
                    Processing may take a few minutes.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
