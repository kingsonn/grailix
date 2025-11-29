"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { MockUSDC_ABI, TOKEN_ADDRESS } from "@/lib/contract";
import { checkClaimStatus, recordClaim, ClaimStatus } from "@/lib/faucetActions";
import { useUser } from "@/lib/useUser";
import { useRouter } from "next/navigation";

/**
 * Claim 1000 MockUSDC Button
 * Calls the faucet function on MockUSDC contract
 * Shows modal with contract info before claiming
 */
export default function ClaimFaucetButton() {
  const { address, isConnected } = useAccount();
  const { user } = useUser();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const { writeContract, data: hash, error, isPending, isSuccess: isWriteSuccess } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch claim status on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchClaimStatus();
    } else {
      setIsLoading(false);
    }
  }, [address]);

  // Update countdown timer every second
  useEffect(() => {
    if (!claimStatus?.timeRemaining || claimStatus.canClaim) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const nextClaim = new Date(claimStatus.nextClaimTime!).getTime();
      const diff = nextClaim - now;

      if (diff <= 0) {
        setTimeRemaining("");
        fetchClaimStatus(); // Refresh status
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [claimStatus]);

  const fetchClaimStatus = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      const status = await checkClaimStatus(address);
      setClaimStatus(status);
    } catch (error) {
      console.error("Error fetching claim status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!TOKEN_ADDRESS) {
      alert("MockUSDC contract address not configured");
      return;
    }

    setShowModal(true);
  };

  const handleClaim = async () => {
    if (!claimStatus?.canClaim) {
      alert("You can only claim once every 24 hours!");
      return;
    }

    try {
      setIsProcessing(true);
      setShowModal(false);

      // Call faucet function with 1000 * 10^18
      const amount = parseUnits("1000", 18);

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

  const addTokenToWallet = async () => {
    if (!window.ethereum) {
      const installUrl = "https://metamask.app.link/dapp/" + window.location.host;
      window.open(installUrl, "_blank");
      alert("Opening wallet app — please try the Add Token action again there.");
      return;
    }

    try {
      await (window.ethereum as any).request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: TOKEN_ADDRESS,
            symbol: "USDC",
            decimals: 18,
            image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
          },
        },
      });
    } catch (error) {
      console.error("Error adding token to wallet:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Record claim when transaction is successful
  useEffect(() => {
    if (isTxSuccess && isProcessing && hash && address && user?.id) {
      recordClaim(address, user.id, 1000, hash)
        .then(() => {
          setIsProcessing(false);
          fetchClaimStatus(); // Refresh claim status
          setTimeout(() => {
            setShowSuccessModal(true);
          }, 100);
        })
        .catch((error) => {
          console.error("Error recording claim:", error);
          setIsProcessing(false);
        });
    }
  }, [isTxSuccess, isProcessing, hash, address, user]);

  const handleGoToWallet = () => {
    setShowSuccessModal(false);
    router.push("/wallet");
  };

  if (error && isProcessing) {
    setIsProcessing(false);
  }

  const buttonDisabled = !isConnected || isPending || isConfirming || isProcessing || !claimStatus?.canClaim || isLoading;

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={buttonDisabled}
        className={`group rounded-lg p-4 transition-all w-full ${
          !claimStatus?.canClaim && !isLoading
            ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 cursor-not-allowed opacity-60"
            : "bg-gradient-to-br from-void-graphite to-profit/5 hover:from-profit/10 hover:to-profit/20 border border-profit/20 hover:border-profit/50 hover:shadow-lg hover:shadow-profit/20 disabled:opacity-50 disabled:cursor-not-allowed"
        }`}
      >
        <div className="text-center">
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
            {isLoading
              ? "⏳"
              : isPending || isConfirming
              ? "⏳"
              : isTxSuccess
              ? "✅"
              : !claimStatus?.canClaim
              ? "⏰"
              : "💰"}
          </div>
          <p className={`font-mono font-bold uppercase transition-colors ${
            !claimStatus?.canClaim && !isLoading
              ? "text-gray-500 text-[10px] sm:text-xs tracking-tight"
              : "text-gray-400 group-hover:text-profit text-xs tracking-wider"
          }`}>
            {isLoading
              ? "Loading..."
              : isPending
              ? "Confirming..."
              : isConfirming
              ? "Processing..."
              : isTxSuccess
              ? "Claimed!"
              : !claimStatus?.canClaim
              ? <span className="text-xs sm:text-xs">{timeRemaining}</span>
              : "Claim 1000 USDC"}
          </p>
        </div>
      </button>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-void-graphite to-void-graphite/95 border border-profit/30 rounded-2xl shadow-2xl shadow-profit/20 max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-profit/20 rounded-full flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
            </div>

            {/* Header */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Successfully Claimed!
            </h2>
            <p className="text-gray-400 text-center mb-6">
              You&apos;ve received <span className="text-profit font-bold">1,000 mockUSDC</span>
            </p>

            {/* Next Steps */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-300 leading-relaxed text-center">
                <span className="font-semibold">💡 Next Step:</span> Deposit your tokens into the vault to start trading predictions!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoToWallet}
                className="w-full bg-gradient-to-r from-profit to-profit/80 hover:from-profit/90 hover:to-profit/70 text-white rounded-lg py-3 px-4 font-semibold transition-all shadow-lg shadow-profit/20 hover:shadow-profit/40 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Go to Wallet & Deposit
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg py-3 px-4 font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-void-graphite to-void-graphite/95 border border-profit/30 rounded-2xl shadow-2xl shadow-profit/20 max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">💰</span>
                <span className="whitespace-nowrap">Claim Tokens</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 mb-6">
              {/* Amount */}
              <div className="bg-profit/10 border border-profit/30 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">You will receive</p>
                <p className="text-3xl font-bold text-profit">1,000 USDC</p>
              </div>

              {/* Chain Info */}
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Network</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <p className="text-white font-semibold">BNB Testnet</p>
                  </div>
                </div>

                {/* Contract Address */}
                <div>
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">MockUSDC Contract</p>
                  <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2">
                    <p className="text-sm text-profit font-mono flex-1 truncate">
                      {TOKEN_ADDRESS}
                    </p>
                    <button
                      onClick={() => copyToClipboard(TOKEN_ADDRESS)}
                      className="text-gray-400 hover:text-profit transition-colors p-1 hover:bg-white/10 rounded flex-shrink-0"
                      title="Copy address"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Add to Wallet Button */}
                <button
                  onClick={addTokenToWallet}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg py-2 px-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                >
                  
                  Add mockUSDC Token to Wallet
                </button>
              </div>

              {/* Cooldown Timer */}
              {!claimStatus?.canClaim && timeRemaining && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                  <p className="text-xs text-orange-300 leading-relaxed">
                    <span className="font-semibold">⏰ Cooldown:</span> You can claim again in <span className="font-mono font-bold">{timeRemaining}</span>
                  </p>
                </div>
              )}

              {/* Info Note */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300 leading-relaxed">
                  <span className="font-semibold">ℹ️ Note:</span> You can claim 1,000 USDC once every 24 hours. These are test tokens on BNB Testnet with no real value.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg py-3 px-4 font-semibold transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleClaim}
                disabled={isPending || isConfirming || !claimStatus?.canClaim}
                className="flex-1 bg-gradient-to-r from-profit to-profit/80 hover:from-profit/90 hover:to-profit/70 text-white rounded-lg py-3 px-4 font-semibold transition-all shadow-lg shadow-profit/20 hover:shadow-profit/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isPending || isConfirming ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-[11px] sm:text-xs">Processing...</span>
                  </>
                ) : !claimStatus?.canClaim ? (
                  <span className="text-[11px] sm:text-xs">Cooldown Active</span>
                ) : (
                  <span className="text-sm sm:text-base">Claim Now</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
