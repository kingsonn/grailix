"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/useUser";
import WalletConnectButton from "@/components/WalletConnectButton";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

interface Prediction {
  id: number;
  prediction_text: string;
  asset: string;
  asset_type?: string;
  raw_text?: string;
  expiry_timestamp: string;
  betting_close?: string;
  direction?: string;
  reference_type?: string;
  sentiment_yes: number;
  sentiment_no: number;
}

export default function PredictClient() {
  const { address, isConnected } = useAccount();
  const { user, isLoading: userLoading, refetch } = useUser();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<"YES" | "NO" | null>(null);
  const [stakeAmount, setStakeAmount] = useState(10);
  const [category, setCategory] = useState<"all" | "stock" | "crypto">("all");
  const [timeLeft, setTimeLeft] = useState("");
  const [timeToBettingClose, setTimeToBettingClose] = useState("");
  const [bettingClosed, setBettingClosed] = useState(false);
  const [skippedIds, setSkippedIds] = useState<number[]>([]); // Track skipped prediction IDs
  
  // Swipe gesture states
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  // Auto-refresh user data
  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
  }, [address, isConnected, refetch]);

  // Fetch next prediction with optional excluded IDs
  const fetchNextPrediction = async (excludedIds?: number[]) => {
    if (!user) return;

    setError(null);
    setBettingClosed(false);
    setTimeToBettingClose("");
    setTimeLeft("");

    try {
      // Use provided excludedIds or fall back to state
      const idsToExclude = excludedIds !== undefined ? excludedIds : skippedIds;
      const excludeIds = idsToExclude.join(',');
      const url = `/api/predictions/next?user_wallet_address=${user.wallet_address}&asset_type=${category}${excludeIds ? `&exclude_ids=${excludeIds}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const newPrediction = data.data.prediction;
        
        // If no prediction found and we have skipped some, reset and try again
        if (!newPrediction && idsToExclude.length > 0) {
          setSkippedIds([]); // Reset skipped list
          // Fetch again without exclusions
          const resetUrl = `/api/predictions/next?user_wallet_address=${user.wallet_address}&asset_type=${category}`;
          const resetResponse = await fetch(resetUrl);
          const resetData = await resetResponse.json();
          
          if (resetData.success) {
            setPrediction(resetData.data.prediction);
          } else {
            setError(resetData.error || "No predictions available");
          }
        } else {
          setPrediction(newPrediction);
        }
      } else {
        setError(data.error || "Failed to fetch prediction");
      }
    } catch (err) {
      console.error("Error fetching prediction:", err);
      setError("Failed to load prediction");
    }
  };

  // Load prediction on mount or category change
  useEffect(() => {
    if (user) {
      setIsLoading(true); // Show loading only on initial load or category change
      setSkippedIds([]); // Reset skipped IDs when category changes
      fetchNextPrediction().finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, category]);

  // Reset betting closed state and submitting when prediction changes
  useEffect(() => {
    if (prediction) {
      const now = new Date().getTime();
      const bettingCloseTime = prediction.betting_close ? new Date(prediction.betting_close).getTime() : 0;
      setBettingClosed(bettingCloseTime > 0 && now >= bettingCloseTime);
      setIsSubmitting(false); // Reset submitting state for new prediction
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction?.id]);

  // Countdown timer for expiry
  useEffect(() => {
    if (!prediction?.expiry_timestamp) {
      setTimeLeft("");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(prediction.expiry_timestamp).getTime();
      const diff = Math.max(expiry - now, 0);

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
        setTimeout(() => fetchNextPrediction(), 2000);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction?.expiry_timestamp]);

  // Countdown timer for betting close
  useEffect(() => {
    if (!prediction?.betting_close) {
      setTimeToBettingClose("");
      setBettingClosed(false);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const bettingCloseTime = new Date(prediction.betting_close!).getTime();
      const diff = Math.max(bettingCloseTime - now, 0);

      if (diff <= 0) {
        setBettingClosed(true);
        setTimeToBettingClose("Closed");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        if (hours > 0) {
          setTimeToBettingClose(`${hours}h ${minutes}m`);
        } else {
          setTimeToBettingClose(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [prediction]);

  // Handle skip - add to skipped list and move to next prediction
  const handleSkip = () => {
    if (prediction) {
      // Check if already in skipped list to prevent duplicates
      const currentId = prediction.id;
      setSkippedIds(prev => {
        if (prev.includes(currentId)) {
          return prev; // Already skipped, don't add again
        }
        const newSkippedIds = [...prev, currentId];
        // Pass the updated IDs directly to avoid stale closure
        fetchNextPrediction(newSkippedIds);
        return newSkippedIds;
      });
    }
    setSelectedPosition(null);
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.touches[0];
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchCurrent || isSubmitting) {
      setTouchStart(null);
      setTouchCurrent(null);
      setIsSwiping(false);
      return;
    }

    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = touchCurrent.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Swipe right for YES (threshold: 100px)
    if (deltaX > 100 && absDeltaX > absDeltaY) {
      handleStake("YES");
    }
    // Swipe left for NO (threshold: 100px)
    else if (deltaX < -100 && absDeltaX > absDeltaY) {
      handleStake("NO");
    }
    // Swipe up for SKIP (threshold: 150px) - Only trigger if dominant vertical movement
    else if (deltaY < -150 && absDeltaY > absDeltaX) {
      handleSkip();
    }

    setTouchStart(null);
    setTouchCurrent(null);
    setIsSwiping(false);
  };

  // Calculate swipe transform and rotation
  const getSwipeStyle = () => {
    if (!touchStart || !touchCurrent || !isSwiping) {
      return {};
    }

    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = touchCurrent.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Only apply transform for horizontal swipes or significant vertical swipes (up)
    // Don't transform for small vertical movements (normal scrolling down)
    if (absDeltaX > absDeltaY || deltaY < -50) {
      const rotation = deltaX / 20; // Rotation based on horizontal movement
      return {
        transform: `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`,
        transition: 'none',
      };
    }
    
    return {};
  };

  // Get overlay opacity based on swipe direction
  const getOverlayOpacity = () => {
    if (!touchStart || !touchCurrent || !isSwiping) return 0;

    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = touchCurrent.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      return Math.min(absDeltaX / 200, 0.8);
    } else {
      return Math.min(absDeltaY / 200, 0.8);
    }
  };

  // Handle stake submission with position parameter
  const handleStake = async (position: "YES" | "NO") => {
    if (!user || !prediction || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSelectedPosition(position);

    try {
      const response = await fetch("/api/predictions/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          prediction_id: prediction.id,
          position: position,
          stake_credits: stakeAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedPosition(null);
        fetchNextPrediction();
        refetch();
      } else {
        setError(data.error || "Failed to submit stake");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error staking:", err);
      setError("Failed to submit stake");
      setIsSubmitting(false);
    }
  };

  // Calculate sentiment percentages
  const totalVotes = prediction ? prediction.sentiment_yes + prediction.sentiment_no : 0;
  const yesPercent = totalVotes > 0 ? Math.round((prediction!.sentiment_yes / totalVotes) * 100) : 50;
  const noPercent = totalVotes > 0 ? Math.round((prediction!.sentiment_no / totalVotes) * 100) : 50;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        {/* Terminal Header with Back Button and Filters */}
        {isConnected && user && (
          <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl mb-4">
            {/* Terminal Title Bar */}
            <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-400 hover:text-grail-light transition-colors group"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-xs font-mono tracking-wider hidden sm:inline">BACK</span>
                </Link>
                <div className="w-px h-4 bg-grail/30"></div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
                  <span className="text-gray-400 text-xs font-mono tracking-wider">PREDICTION_MARKET</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-grail/10 px-2.5 py-1 rounded-full border border-grail/30">
                <div className="w-1.5 h-1.5 rounded-full bg-grail animate-pulse shadow-lg shadow-grail/50"></div>
                <span className="text-grail-light text-xs font-mono font-bold">ACTIVE</span>
              </div>
            </div>
            
            {/* Filters and Stake Amount */}
            <div className="p-4 space-y-4">
              {/* Category Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 text-xs font-mono uppercase mr-2">Filter:</span>
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "All", icon: "🌐" },
                    { value: "stock", label: "Stocks", icon: "📈" },
                    { value: "crypto", label: "Crypto", icon: "₿" },
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                        category === cat.value
                          ? "bg-gradient-to-r from-grail to-grail-light text-white shadow-lg shadow-grail/30 border border-grail/50"
                          : "bg-void-graphite text-gray-400 hover:text-white hover:bg-void-graphite/60 border border-grail/20"
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span className="hidden sm:inline">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake Amount Slider */}
              <div className="bg-void-graphite/50 border border-grail/20 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Label and Value */}
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-auric"></div>
                      <label className="text-xs font-mono text-gray-500 uppercase whitespace-nowrap">Default_Stake</label>
                    </div>
                    <div className="flex items-center gap-2 bg-auric/10 px-3 py-1.5 rounded-lg border border-auric/30">
                      <span className="text-auric text-xl sm:text-2xl font-bold font-mono tabular-nums">{stakeAmount}</span>
                      <span className="text-xs font-mono text-gray-400">USDC</span>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="flex-1 py-2 sm:py-0">
                    <input
                      type="range"
                      min="1"
                      max={user?.real_credits_balance || 100}
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Number(e.target.value))}
                      className="w-full h-3 sm:h-2 bg-void-graphite rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, rgb(125, 44, 255) 0%, rgb(125, 44, 255) ${((stakeAmount - 1) / ((user?.real_credits_balance || 100) - 1)) * 100}%, rgb(31, 41, 55) ${((stakeAmount - 1) / ((user?.real_credits_balance || 100) - 1)) * 100}%, rgb(31, 41, 55) 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-loss/10 border border-loss rounded-xl p-4 mb-6 text-loss">
            ⚠️ {error}
          </div>
        )}

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="grail-glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold mb-3">Connect to Trade</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to access professional prediction markets
            </p>
            <WalletConnectButton />
          </div>
        )}

        {/* Loading State */}
        {isConnected && isLoading && !prediction && (
          <div className="grail-card rounded-2xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-grail border-t-transparent mb-4"></div>
            <p className="text-grail-pale text-lg">Loading next prediction...</p>
          </div>
        )}

        {/* Prediction Card - Terminal Style */}
        {isConnected && user && prediction && !isLoading && (
          <div className="fade-in">
            {/* Desktop: Multi-grid view, Mobile/Tablet: Single card */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-4">
              {/* Swipeable Container - wraps both cards on mobile */}
              <div 
                className="lg:contents relative"
                style={getSwipeStyle()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Swipe Overlays - Mobile Only - covers both cards */}
                {isSwiping && touchStart && touchCurrent && (
                  <>
                    {/* YES Overlay (Swipe Right) */}
                    {touchCurrent.x > touchStart.x && Math.abs(touchCurrent.x - touchStart.x) > Math.abs(touchCurrent.y - touchStart.y) && (
                      <div 
                        className="fixed inset-0 bg-profit/40 backdrop-blur-sm z-50 flex items-center justify-center lg:hidden pointer-events-none"
                        style={{ opacity: getOverlayOpacity() }}
                      >
                        <div className="text-white text-6xl font-black font-mono transform rotate-12">
                          YES
                        </div>
                      </div>
                    )}
                    
                    {/* NO Overlay (Swipe Left) */}
                    {touchCurrent.x < touchStart.x && Math.abs(touchCurrent.x - touchStart.x) > Math.abs(touchCurrent.y - touchStart.y) && (
                      <div 
                        className="fixed inset-0 bg-loss/40 backdrop-blur-sm z-50 flex items-center justify-center lg:hidden pointer-events-none"
                        style={{ opacity: getOverlayOpacity() }}
                      >
                        <div className="text-white text-6xl font-black font-mono transform -rotate-12">
                          NO
                        </div>
                      </div>
                    )}
                    
                    {/* SKIP Overlay (Swipe Up) */}
                    {(() => {
                      const deltaY = touchCurrent.y - touchStart.y;
                      const deltaX = touchCurrent.x - touchStart.x;
                      const absDeltaY = Math.abs(deltaY);
                      const absDeltaX = Math.abs(deltaX);
                      
                      return deltaY < -50 && absDeltaY > absDeltaX && (
                        <div 
                          className="fixed inset-0 bg-gray-500/40 backdrop-blur-sm z-50 flex items-center justify-center lg:hidden pointer-events-none"
                          style={{ opacity: getOverlayOpacity() }}
                        >
                          <div className="text-white text-6xl font-black font-mono">
                            SKIP
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
                
                {/* Main Prediction Card */}
                <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl mb-4 lg:mb-0">
                {/* Terminal Title Bar */}
                <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse shadow-lg shadow-neon/50"></div>
                    <span className="text-gray-400 text-xs font-mono tracking-wider">PREDICTION_DATA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono text-gray-500">ID: {prediction.id}</div>
                  </div>
                </div>

                {/* Asset Header */}
                <div className="p-4 border-b border-grail/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-grail/20 to-grail/5 border border-grail/30 flex items-center justify-center text-xl">
                        {prediction.asset_type === "crypto" ? "₿" : "📈"}
                      </div>
                      <div>
                        <h3 className="text-xl font-black font-mono text-white">{prediction.asset}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">
                          {prediction.asset_type || "Market"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1 font-mono">RESOLVES_IN</div>
                      <div className="text-lg font-bold text-neon font-mono tabular-nums">{timeLeft}</div>
                    </div>
                  </div>
                </div>

                {/* Prediction Text */}
                <div className="p-4 border-b border-grail/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-grail"></div>
                    <span className="text-xs font-mono text-gray-500 uppercase">Question</span>
                  </div>
                  <p className="text-base text-gray-200 leading-relaxed font-mono">
                    {prediction.prediction_text}
                  </p>
                </div>

                {/* Raw Text */}
                {prediction.raw_text && (
                  <div className="p-4 border-b border-grail/20 bg-void-graphite/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-1 rounded-full bg-auric"></div>
                      <span className="text-xs font-mono text-gray-500 uppercase">Raw_Data</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed font-mono">
                      {prediction.raw_text}
                    </p>
                  </div>
                )}

                {/* Betting Close Timer */}
                {prediction.betting_close && (
                  <div className="p-4 border-b border-grail/20">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold ${
                      bettingClosed ? 'bg-loss/20 text-loss border border-loss/30' : 'bg-neon/20 text-neon border border-neon/30'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${bettingClosed ? 'bg-loss' : 'bg-neon animate-pulse'}`}></div>
                      <span>
                        {bettingClosed ? "BETTING_CLOSED" : `CLOSES_IN: ${timeToBettingClose}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* User Balance */}
                <div className="p-4 bg-void-graphite/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500 uppercase">Your_Balance</span>
                    <div className="flex items-center gap-2">
                      <span className="text-auric font-bold text-lg font-mono tabular-nums">{user.real_credits_balance}</span>
                      <span className="text-xs font-mono text-gray-500">USDC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Panel */}
              <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl">
                {/* Terminal Title Bar */}
                <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse shadow-lg shadow-profit/50"></div>
                    <span className="text-gray-400 text-xs font-mono tracking-wider">ACTION_PANEL</span>
                  </div>
                </div>

                {/* Market Sentiment */}
                <div className="p-4 border-b border-grail/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-grail"></div>
                      <span className="text-xs font-mono text-gray-500 uppercase">Market_Sentiment</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{totalVotes} votes</span>
                  </div>
                  
                  {/* Sentiment Bar */}
                  <div className="relative h-2 bg-void-black rounded-full overflow-hidden mb-3 border border-grail/20">
                    <div
                      className="absolute left-0 top-0 h-full bg-profit transition-all duration-500"
                      style={{ width: `${yesPercent}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-loss transition-all duration-500"
                      style={{ width: `${noPercent}%` }}
                    />
                  </div>

                  {/* Percentages */}
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="profit-text">{yesPercent}% YES</span>
                    <span className="loss-text">{noPercent}% NO</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleStake("YES")}
                      disabled={bettingClosed || isSubmitting}
                      className="group relative bg-gradient-to-br from-profit to-profit/80 hover:from-profit/90 hover:to-profit/70 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-lg transition-all hover:scale-[1.02] border border-profit/50 shadow-lg shadow-profit/20 font-mono overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-profit/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex flex-col items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-white/80 group-hover:bg-white transition-colors"></div>
                        <div className="text-base tracking-wider">{isSubmitting && selectedPosition === "YES" ? "..." : "YES"}</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleSkip}
                      disabled={isSubmitting}
                      className="group relative bg-void-graphite hover:bg-void-graphite/60 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white font-bold py-6 rounded-lg transition-all border border-grail/20 hover:border-grail/40 font-mono overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-grail/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex flex-col items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-500 group-hover:bg-gray-300 transition-colors"></div>
                        <div className="text-base tracking-wider">SKIP</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleStake("NO")}
                      disabled={bettingClosed || isSubmitting}
                      className="group relative bg-gradient-to-br from-loss to-loss/80 hover:from-loss/90 hover:to-loss/70 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-lg transition-all hover:scale-[1.02] border border-loss/50 shadow-lg shadow-loss/20 font-mono overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-loss/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex flex-col items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-white/80 group-hover:bg-white transition-colors"></div>
                        <div className="text-base tracking-wider">{isSubmitting && selectedPosition === "NO" ? "..." : "NO"}</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-void-graphite/30 border-t border-grail/20">
                  <div className="space-y-2 text-xs font-mono text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-profit"></div>
                      <span>YES: Predict outcome will occur</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-loss"></div>
                      <span>NO: Predict outcome won&apos;t occur</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                      <span>SKIP: Pass to next prediction</span>
                    </div>
                  </div>
                </div>
              </div>
              </div> {/* Close swipeable container */}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
