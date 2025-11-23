"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { v4 as uuidv4 } from "uuid";
import { VAULT_ADDRESS, TOKEN_ADDRESS, MockUSDC_ABI, GrailixVault_ABI } from "@/lib/contract";
import WalletConnectButton from "@/components/WalletConnectButton";
import AppLayout from "@/components/AppLayout";

export default function WalletClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { user, isLoading, refetch } = useUser();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [currentDepositId, setCurrentDepositId] = useState<string>("");

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
      setCurrentDepositId(internalDepositId); // Store for later use

      writeDeposit({
        address: VAULT_ADDRESS,
        abi: GrailixVault_ABI,
        functionName: "deposit",
        args: [amountInWei, internalDepositId],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              internal_deposit_id: currentDepositId, // Include the deposit ID
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-mono text-sm group"
        >
          <div className="w-6 h-6 rounded border border-grail/30 group-hover:border-grail/60 flex items-center justify-center transition-colors">
            <span className="text-xs">←</span>
          </div>
          <span>BACK_TO_DASHBOARD</span>
        </button>

        {!isConnected && (
          <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
                <span className="text-gray-400 text-xs font-mono tracking-wider">WALLET_AUTH</span>
              </div>
              <div className="flex items-center gap-2 bg-grail/10 px-2.5 py-1 rounded-full border border-grail/30">
                <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
                <span className="text-grail-light text-xs font-mono font-bold">REQUIRED</span>
              </div>
            </div>
            
            <div className="p-8 md:p-12">
              <div className="max-w-md mx-auto bg-gradient-to-br from-grail/5 to-grail/10 border border-grail/30 rounded-lg p-6 md:p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-grail/10 border border-grail/40 flex items-center justify-center shadow-lg shadow-grail/20">
                    <span className="text-3xl">🔐</span>
                  </div>
                  <h2 className="text-2xl font-black mb-2 text-white font-mono">CONNECT_WALLET</h2>
                  <p className="text-gray-400 text-sm font-mono leading-relaxed">
                    Initialize secure connection to access fund management
                  </p>
                </div>
                
                <WalletConnectButton />
                
                <div className="mt-6 pt-6 border-t border-grail/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <div className="w-1 h-1 rounded-full bg-profit"></div>
                    <span>Deposit and withdraw funds</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <div className="w-1 h-1 rounded-full bg-auric"></div>
                    <span>Manage your balance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isConnected && user && (
          <div className="fade-in">
            {/* Balance Card - Compact */}
            <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl mb-4">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-auric animate-pulse shadow-lg shadow-auric/50"></div>
                    <span className="text-gray-500 text-xs uppercase font-mono">Balance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-black text-auric font-mono tabular-nums">{user.real_credits_balance}</h1>
                    <span className="text-gray-400 text-xs font-mono uppercase bg-auric/10 px-2 py-1 rounded border border-auric/30">USDC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs - Terminal Style */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`
                  flex-1 py-4 rounded-lg font-bold font-mono transition-all border text-sm sm:text-base
                  ${activeTab === "deposit" 
                    ? "bg-gradient-to-br from-profit to-profit/80 text-white border-profit/50 shadow-lg shadow-profit/20" 
                    : "bg-void-graphite text-gray-400 hover:text-white border-grail/20 hover:border-grail/40"
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "deposit" ? "bg-white" : "bg-gray-500"}`}></div>
                  <span>DEPOSIT</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`
                  flex-1 py-4 rounded-lg font-bold font-mono transition-all border text-sm sm:text-base
                  ${activeTab === "withdraw" 
                    ? "bg-gradient-to-br from-neon to-neon/80 text-void-black border-neon/50 shadow-lg shadow-neon/20" 
                    : "bg-void-graphite text-gray-400 hover:text-white border-grail/20 hover:border-grail/40"
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "withdraw" ? "bg-void-black" : "bg-gray-500"}`}></div>
                  <span>WITHDRAW</span>
                </div>
              </button>
            </div>

            {/* Status Message - Terminal Style */}
            {statusMessage && (
              <div className={`
                rounded-lg p-4 mb-6 border font-mono text-sm
                ${statusMessage.type === "success" ? "bg-profit/10 border-profit text-profit" : ""}
                ${statusMessage.type === "error" ? "bg-loss/10 border-loss text-loss" : ""}
                ${statusMessage.type === "info" ? "bg-neon/10 border-neon text-neon" : ""}
              `}>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse
                    ${statusMessage.type === "success" ? "bg-profit" : ""}
                    ${statusMessage.type === "error" ? "bg-loss" : ""}
                    ${statusMessage.type === "info" ? "bg-neon" : ""}
                  `}></div>
                  <span>{statusMessage.text}</span>
                </div>
              </div>
            )}

            {/* Deposit Tab - Terminal Style */}
            {activeTab === "deposit" && (
              <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse shadow-lg shadow-profit/50"></div>
                    <span className="text-gray-400 text-xs font-mono tracking-wider">DEPOSIT_INTERFACE</span>
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 font-mono">DEPOSIT_MOCKUSDC</h2>
                
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-auric"></div>
                    <label className="block text-xs text-gray-500 uppercase font-mono">Amount</label>
                  </div>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-void-graphite border border-grail/30 rounded-lg px-4 sm:px-6 py-3 sm:py-4 text-white text-xl sm:text-2xl font-bold font-mono tabular-nums focus:outline-none focus:border-auric transition-colors"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
                  {[10, 50, 100, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="bg-void-graphite hover:bg-grail/20 text-white py-2 sm:py-3 rounded-lg font-bold font-mono text-sm sm:text-base transition-all border border-grail/20 hover:border-grail/40"
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="w-full bg-gradient-to-br from-profit to-profit/80 hover:from-profit/90 hover:to-profit/70 text-white font-bold font-mono py-4 sm:py-5 rounded-lg text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-profit/50 shadow-lg shadow-profit/20"
                >
                  {isProcessing ? "PROCESSING..." : "EXECUTE_DEPOSIT"}
                </button>

                <div className="mt-6 p-4 bg-void-graphite/50 rounded-lg border border-grail/20">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-neon mt-1.5"></div>
                    <p className="text-xs text-gray-400 leading-relaxed font-mono">
                      <span className="text-neon font-bold">PROCESS:</span> Deposits execute in 3 steps: 
                      (1) Token approval, (2) Vault deposit, (3) Balance update. 
                      Maximum security protocol enforced.
                    </p>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Withdraw Tab - Terminal Style */}
            {activeTab === "withdraw" && (
              <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse shadow-lg shadow-neon/50"></div>
                    <span className="text-gray-400 text-xs font-mono tracking-wider">WITHDRAW_INTERFACE</span>
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 font-mono">WITHDRAW_MOCKUSDC</h2>
                
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-neon"></div>
                    <label className="block text-xs text-gray-500 uppercase font-mono">Amount</label>
                  </div>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    max={user.real_credits_balance}
                    className="w-full bg-void-graphite border border-grail/30 rounded-lg px-4 sm:px-6 py-3 sm:py-4 text-white text-xl sm:text-2xl font-bold font-mono tabular-nums focus:outline-none focus:border-neon transition-colors"
                  />
                  <div className="flex justify-between mt-2 text-xs font-mono">
                    <span className="text-gray-500">MIN: 1</span>
                    <span className="text-gray-400">
                      AVAILABLE: <span className="text-auric font-bold tabular-nums">{user.real_credits_balance}</span>
                    </span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6">
                  {[10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setWithdrawAmount(amount.toString())}
                      disabled={amount > user.real_credits_balance}
                      className="bg-void-graphite hover:bg-grail/20 disabled:opacity-30 disabled:cursor-not-allowed text-white py-2 sm:py-3 rounded-lg font-bold font-mono text-xs sm:text-base transition-all border border-grail/20 hover:border-grail/40"
                    >
                      {amount}
                    </button>
                  ))}
                  <button
                    onClick={() => setWithdrawAmount(user.real_credits_balance.toString())}
                    className="bg-void-graphite hover:bg-grail/20 text-white py-2 sm:py-3 rounded-lg font-bold font-mono text-xs sm:text-base transition-all border border-grail/20 hover:border-grail/40"
                  >
                    MAX
                  </button>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > user.real_credits_balance}
                  className="w-full bg-gradient-to-br from-neon to-neon/80 hover:from-neon/90 hover:to-neon/70 text-void-black font-bold font-mono py-4 sm:py-5 rounded-lg text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-neon/50 shadow-lg shadow-neon/20"
                >
                  {isProcessing ? "PROCESSING..." : "EXECUTE_WITHDRAW"}
                </button>

                <div className="mt-6 p-4 bg-void-graphite/50 rounded-lg border border-grail/20">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-loss mt-1.5"></div>
                    <p className="text-xs text-gray-400 leading-relaxed font-mono">
                      <span className="text-loss font-bold">WARNING:</span> Withdrawals processed via smart contract. 
                      Funds transfer to connected wallet address. 
                      Processing time: ~2-5 minutes.
                    </p>
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
