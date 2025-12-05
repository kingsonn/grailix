"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/useUser";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useToast } from "@/components/ToastContainer";

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
  created_price?: number | null;
}

export default function PredictClient() {
  const { isConnected, address } = useAccount();
  const { user, isLoading: userLoading, refetch } = useUser();
  const { showToast } = useToast();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [nextPrediction, setNextPrediction] = useState<Prediction | null>(null); // Pre-fetch next card
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<"YES" | "NO" | null>(null);
  const [stakeAmount, setStakeAmount] = useState(1);
  const [category, setCategory] = useState<"all" | "stock" | "crypto">("all");
  const [timeLeft, setTimeLeft] = useState("");
  const [timeToBettingClose, setTimeToBettingClose] = useState("");
  const [bettingClosed, setBettingClosed] = useState(false);
  const [skippedIds, setSkippedIds] = useState<number[]>([]); // Track skipped prediction IDs
  const [votedIds, setVotedIds] = useState<number[]>([]); // Track predictions being voted on
  const [localBalance, setLocalBalance] = useState<number | null>(null); // Local balance for optimistic updates
  const [isBalanceLoading, setIsBalanceLoading] = useState(false); // Balance loading state
  
  // View mode states
  const [viewMode, setViewMode] = useState<"single" | "multi">("single");
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [infoModalPrediction, setInfoModalPrediction] = useState<Prediction | null>(null);
  const [swipingCardId, setSwipingCardId] = useState<number | null>(null);
  const [cardSwipeX, setCardSwipeX] = useState(0);
  
  // Swipe gesture states
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Double tap to skip (Instagram-style)
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showSkipAnimation, setShowSkipAnimation] = useState(false);

  // Auto-refresh user data on wallet connection
  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  // Set smart default stake based on balance
  useEffect(() => {
    if (user?.real_credits_balance) {
      const balance = user.real_credits_balance;
      if (balance < 20) {
        setStakeAmount(Math.min(1, balance));
      } else {
        setStakeAmount(Math.min(10, balance));
      }
    }
  }, [user?.real_credits_balance]);

  // Fetch next prediction with optional excluded IDs (works for guests too)
  const fetchNextPrediction = async (excludedIds?: number[], isPreFetch: boolean = false) => {

    if (!isPreFetch) {
      setError(null);
      setBettingClosed(false);
      setTimeToBettingClose("");
      setTimeLeft("");
    }

    try {
      // Use provided excludedIds or fall back to state, and always include votedIds
      const idsToExclude = excludedIds !== undefined ? excludedIds : skippedIds;
      const allExcludedIds = [...new Set([...idsToExclude, ...votedIds])]; // Combine and deduplicate
      const excludeIds = allExcludedIds.join(',');
      // For guests, skip the wallet parameter
      const walletParam = user?.wallet_address ? `user_wallet_address=${user.wallet_address}&` : '';
      const url = `/api/predictions/next?${walletParam}asset_type=${category}${excludeIds ? `&exclude_ids=${excludeIds}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const newPrediction = data.data.prediction;
        
        // If no prediction found
        if (!newPrediction) {
          // Reset skipped cards and retry (keep voted cards excluded)
          if (skippedIds.length > 0) {
            setSkippedIds([]); // Reset skipped list
            // Fetch again excluding only voted IDs
            const votedIdsOnly = votedIds.join(',');
            const walletParamReset = user?.wallet_address ? `user_wallet_address=${user.wallet_address}&` : '';
            const resetUrl = `/api/predictions/next?${walletParamReset}asset_type=${category}${votedIdsOnly ? `&exclude_ids=${votedIdsOnly}` : ''}`;
            const resetResponse = await fetch(resetUrl);
            const resetData = await resetResponse.json();
            
            if (resetData.success && resetData.data.prediction) {
              if (isPreFetch) {
                setNextPrediction(resetData.data.prediction);
              } else {
                setPrediction(resetData.data.prediction);
              }
            } else {
              if (!isPreFetch) {
                setError("No more predictions available");
                setPrediction(null);
              }
            }
          } else {
            // No predictions available (all voted or truly empty)
            if (!isPreFetch) {
              setError("No more predictions available");
              setPrediction(null);
            }
          }
        } else {
          if (isPreFetch) {
            setNextPrediction(newPrediction);
          } else {
            setPrediction(newPrediction);
          }
        }
      } else {
        if (!isPreFetch) {
          setError(data.error || "Failed to fetch prediction");
        }
      }
    } catch (err) {
      console.error("Error fetching prediction:", err);
      if (!isPreFetch) {
        setError("Failed to load prediction");
      }
    }
  };

  // Fetch all predictions for multi-view mode (works for guests too)
  const fetchAllPredictions = async () => {
    try {
      const excludeIds = votedIds.join(',');
      // For guests, use a placeholder wallet address or skip the parameter
      const walletParam = user?.wallet_address ? `user_wallet_address=${user.wallet_address}&` : '';
      const url = `/api/predictions/list?${walletParam}asset_type=${category}&limit=20${excludeIds ? `&exclude_ids=${excludeIds}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data.predictions) {
        // Filter out any predictions that are in votedIds (in case API doesn't support exclude)
        const filtered = data.data.predictions.filter((p: Prediction) => !votedIds.includes(p.id));
        setAllPredictions(filtered);
      }
    } catch (err) {
      console.error("Error fetching all predictions:", err);
    }
  };

  // Pre-fetch next prediction in background
  const preFetchNext = async () => {
    if (!prediction) return;
    
    // Exclude current prediction, skipped ones, and voted ones
    const excludeIds = [...skippedIds, ...votedIds, prediction.id];
    await fetchNextPrediction(excludeIds, true);
  };

  // Load prediction on mount or category change (works for guests too)
  useEffect(() => {
    setIsLoading(true); // Show loading only on initial load or category change
    setSkippedIds([]); // Reset skipped IDs when category changes
    setVotedIds([]); // Reset voted IDs when category changes
    
    if (viewMode === "single") {
      fetchNextPrediction().finally(() => setIsLoading(false));
    } else {
      fetchAllPredictions().finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, category, viewMode, isConnected]);

  // Reset betting closed state and submitting when prediction changes
  useEffect(() => {
    if (prediction) {
      const now = new Date().getTime();
      const bettingCloseTime = prediction.betting_close ? new Date(prediction.betting_close).getTime() : 0;
      setBettingClosed(bettingCloseTime > 0 && now >= bettingCloseTime);
      setIsSubmitting(false); // Reset submitting state for new prediction
      
      // Pre-fetch next prediction
      preFetchNext();
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
      const currentId = prediction.id;
      
      // INSTANTLY move to next card (use pre-fetched or fetch new)
      if (nextPrediction) {
        // Use pre-fetched card for instant transition
        setPrediction(nextPrediction);
        setNextPrediction(null);
        setSkippedIds(prev => [...prev, currentId]);
      } else {
        // Fallback: fetch if no pre-fetch available
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
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Prevent horizontal scroll on body during swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
    
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchCurrent) {
      setTouchStart(null);
      setTouchCurrent(null);
      setIsSwiping(false);
      return;
    }

    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = touchCurrent.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Clear touch state immediately to prevent queue
    setTouchStart(null);
    setTouchCurrent(null);
    setIsSwiping(false);

    // Swipe right for YES (threshold: 100px)
    if (deltaX > 100 && absDeltaX > absDeltaY) {
      handleStake("YES");
    }
    // Swipe left for NO (threshold: 100px)
    else if (deltaX < -100 && absDeltaX > absDeltaY) {
      handleStake("NO");
    }
    // Note: Swipe up for skip removed on mobile - use double tap instead
  };

  // Double tap handler for skip (Instagram-style)
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms
    
    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
      // Double tap detected - trigger skip with animation
      setShowSkipAnimation(true);
      setTimeout(() => setShowSkipAnimation(false), 600);
      handleSkip();
      setLastTapTime(0); // Reset to prevent triple tap
    } else {
      setLastTapTime(now);
    }
  };

  // Calculate swipe transform and rotation
  const getSwipeStyle = () => {
    if (!touchStart || !touchCurrent || !isSwiping) {
      return { transition: 'transform 0.3s ease-out' };
    }

    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = touchCurrent.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Only apply transform for horizontal swipes
    if (absDeltaX > absDeltaY) {
      // Limit the swipe distance to prevent overflow
      const clampedX = Math.max(-200, Math.min(200, deltaX));
      const rotation = clampedX / 25; // Slightly reduced rotation
      return {
        transform: `translate(${clampedX}px, 0px) rotate(${rotation}deg)`,
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
    if (!user || !prediction) return;
    
    // Prevent trading with insufficient balance
    if ((user?.real_credits_balance || 0) < 1 || stakeAmount < 1) {
      showToast(
        "error",
        "Insufficient Balance",
        "You need at least 1 USDC to make a prediction.",
        3000
      );
      return;
    }
    
    // Prevent trading if stake exceeds balance
    if (stakeAmount > (user?.real_credits_balance || 0)) {
      showToast(
        "error",
        "Insufficient Balance",
        `You only have ${user?.real_credits_balance || 0} USDC available.`,
        3000
      );
      return;
    }

    // Store current prediction info for toast
    const currentQuestion = prediction.prediction_text;
    const currentPredictionId = prediction.id;

    // Add to votedIds IMMEDIATELY to prevent showing again
    setVotedIds(prev => [...prev, currentPredictionId]);

    // Optimistically update balance (subtract stake amount)
    const currentBalance = localBalance ?? user.real_credits_balance;
    setLocalBalance(currentBalance - stakeAmount);
    setIsBalanceLoading(true);

    // INSTANTLY move to next card (use pre-fetched or fetch new)
    setSelectedPosition(position);
    setIsSubmitting(true);
    setError(null);
    
    if (nextPrediction) {
      // Use pre-fetched card for instant transition
      setPrediction(nextPrediction);
      setNextPrediction(null);
    } else {
      // Fallback: fetch if no pre-fetch available
      const excludeIds = [...skippedIds, ...votedIds, currentPredictionId];
      fetchNextPrediction(excludeIds, false);
    }

    // Clear isSubmitting immediately to allow next click
    setIsSubmitting(false);
    setSelectedPosition(null);

    // Submit stake in background (don't block)
    try {
      const response = await fetch("/api/predictions/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          prediction_id: currentPredictionId,
          position: position,
          stake_credits: stakeAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success toast with question and answer
        showToast(
          "success",
          `Predicted: ${position}`,
          currentQuestion,
          5000
        );
        
        // Stop loading after short delay (keep optimistic balance)
        setTimeout(() => {
          setIsBalanceLoading(false);
        }, 500);
      } else {
        // Show error toast
        showToast(
          "error",
          "Prediction Failed",
          data.error || "Failed to submit stake",
          5000
        );
        
        // Revert optimistic update on error
        setLocalBalance(null);
        setIsBalanceLoading(false);
      }
    } catch (err) {
      console.error("Error staking:", err);
      showToast(
        "error",
        "Prediction Failed",
        "Network error. Please try again.",
        5000
      );
      
      // Revert optimistic update on error
      setLocalBalance(null);
      setIsBalanceLoading(false);
    }
  };

  // Handle stake for multi-view mode (removes card after voting)
  const handleMultiViewStake = async (pred: Prediction, position: "YES" | "NO") => {
    if (!user) return;
    
    // Prevent trading with insufficient balance
    if ((user?.real_credits_balance || 0) < 1 || stakeAmount < 1) {
      showToast("error", "Insufficient Balance", "You need at least 1 USDC to make a prediction.", 3000);
      return;
    }
    
    if (stakeAmount > (user?.real_credits_balance || 0)) {
      showToast("error", "Insufficient Balance", `You only have ${user?.real_credits_balance || 0} USDC available.`, 3000);
      return;
    }

    // Add to votedIds and remove from allPredictions immediately
    setVotedIds(prev => [...prev, pred.id]);
    setAllPredictions(prev => prev.filter(p => p.id !== pred.id));
    
    // Optimistically update balance
    const currentBalance = localBalance ?? user.real_credits_balance;
    setLocalBalance(currentBalance - stakeAmount);
    setIsBalanceLoading(true);

    // Submit stake in background
    try {
      const response = await fetch("/api/predictions/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          prediction_id: pred.id,
          position: position,
          stake_credits: stakeAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("success", `Predicted: ${position}`, pred.prediction_text, 5000);
        setTimeout(() => setIsBalanceLoading(false), 500);
      } else {
        showToast("error", "Prediction Failed", data.error || "Failed to submit stake", 5000);
        setLocalBalance(null);
        setIsBalanceLoading(false);
        // Re-add the prediction if failed
        setAllPredictions(prev => [pred, ...prev]);
        setVotedIds(prev => prev.filter(id => id !== pred.id));
      }
    } catch (err) {
      console.error("Error staking:", err);
      showToast("error", "Prediction Failed", "Network error. Please try again.", 5000);
      setLocalBalance(null);
      setIsBalanceLoading(false);
      setAllPredictions(prev => [pred, ...prev]);
      setVotedIds(prev => prev.filter(id => id !== pred.id));
    }
  };

  // Mini card swipe handlers for multi-view
  const handleMiniCardTouchStart = (e: React.TouchEvent, predId: number) => {
    const touch = e.touches[0];
    setSwipingCardId(predId);
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setCardSwipeX(0);
  };

  const handleMiniCardTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || swipingCardId === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Only track horizontal swipes, prevent vertical scroll interference
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      // Clamp the swipe distance for smoother feel
      const clampedX = Math.max(-120, Math.min(120, deltaX));
      setCardSwipeX(clampedX);
    }
  };

  const handleMiniCardTouchEnd = (pred: Prediction) => {
    if (!touchStart || swipingCardId === null) {
      setSwipingCardId(null);
      setTouchStart(null);
      setCardSwipeX(0);
      return;
    }

    const threshold = 60; // Reduced threshold for easier swiping
    
    if (cardSwipeX > threshold) {
      // Swipe right = YES
      handleMultiViewStake(pred, "YES");
    } else if (cardSwipeX < -threshold) {
      // Swipe left = NO
      handleMultiViewStake(pred, "NO");
    }
    
    setSwipingCardId(null);
    setTouchStart(null);
    setCardSwipeX(0);
  };

  // Calculate sentiment percentages
  const totalVotes = prediction ? prediction.sentiment_yes + prediction.sentiment_no : 0;
  const yesPercent = totalVotes > 0 ? Math.round((prediction!.sentiment_yes / totalVotes) * 100) : 50;
  const noPercent = totalVotes > 0 ? Math.round((prediction!.sentiment_no / totalVotes) * 100) : 50;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 pb-32 overflow-x-hidden">
        {/* Terminal Header with Back Button and Filters - Show for all users */}
        <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl mb-4">
            {/* Terminal Title Bar with Filters */}
            <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-400 md:hover:text-grail-light transition-colors group"
                >
                  <svg className="w-4 h-4 md:group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-xs font-mono tracking-wider hidden sm:inline">BACK</span>
                </Link>
                <div className="w-px h-4 bg-grail/30"></div>
                {/* Filters in Header */}
                <div className="flex gap-1 sm:gap-1.5 overflow-x-auto flex-nowrap no-scrollbar -mx-1 px-1">
                  {[
                    { value: "all", label: "All", icon: "🌐" },
                    { value: "stock", label: "Stocks", icon: "📈" },
                    { value: "crypto", label: "Crypto", icon: "₿" },
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value as any)}
                      className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-md font-mono text-[10px] sm:text-xs font-bold transition-all active:scale-95 ${
                        category === cat.value
                          ? "bg-gradient-to-r from-grail to-grail-light text-white shadow-md shadow-grail/20 border border-grail/50"
                          : "bg-void-graphite/50 text-gray-400 md:hover:text-white md:hover:bg-void-graphite border border-grail/10"
                      }`}
                    >
                      <span className="text-xs sm:text-[11px] leading-none">{cat.icon}</span>
                      <span className="hidden sm:inline text-[10px] leading-none">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === "single" ? "multi" : "single")}
                className="relative flex-shrink-0 flex items-center gap-1 bg-void-graphite/80 p-0.5 sm:p-1 rounded-full border border-grail/30 transition-all"
              >
                <div
                  className={`absolute h-5 w-10 sm:h-6 sm:w-12 bg-gradient-to-r from-grail to-grail-light rounded-full transition-all duration-300 ease-out ${
                    viewMode === "multi" ? "translate-x-10 sm:translate-x-[48px]" : "translate-x-0"
                  }`}
                />
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-5 sm:w-12 sm:h-6 rounded-full text-[9px] sm:text-[10px] font-mono font-bold transition-colors duration-300 ${
                    viewMode === "single" ? "text-white" : "text-gray-400"
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                  </svg>
                </div>
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-5 sm:w-12 sm:h-6 rounded-full text-[9px] sm:text-[10px] font-mono font-bold transition-colors duration-300 ${
                    viewMode === "multi" ? "text-white" : "text-gray-400"
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                    <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                    <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                    <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                  </svg>
                </div>
              </button>
            </div>
          </div>

        {/* Empty State - No Predictions Available */}
        {!isLoading && ((viewMode === "single" && !prediction) || (viewMode === "multi" && allPredictions.length === 0)) && (
          <div className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-auric animate-pulse shadow-lg shadow-auric/50"></div>
                <span className="text-gray-400 text-xs font-mono tracking-wider">NO_PREDICTIONS_AVAILABLE</span>
              </div>
            </div>
            <div className="p-8 sm:p-12 text-center">
              <div className="text-6xl sm:text-7xl mb-6">📭</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 font-mono">
                {votedIds.length > 0 ? "ALL_PREDICTIONS_VOTED" : "NO_ACTIVE_PREDICTIONS"}
              </h3>
              <p className="text-gray-400 mb-6 font-mono text-sm">
                {votedIds.length > 0
                  ? `You've voted on all available ${category === "all" ? "" : category.toUpperCase() + " "}predictions! Check back later for new ones or try a different category.`
                  : category === "all" 
                    ? "No predictions available at the moment. Check back soon!"
                    : `No ${category.toUpperCase()} predictions available. Try a different category.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {category !== "all" && (
                  <button
                    onClick={() => setCategory("all")}
                    className="bg-gradient-to-br from-grail to-grail/80 md:hover:from-grail/90 md:hover:to-grail text-white font-bold font-mono py-3 px-6 rounded-lg transition-all shadow-lg shadow-grail/20 md:hover:shadow-grail/40 active:scale-95"
                  >
                    VIEW_ALL_CATEGORIES
                  </button>
                )}
                <Link
                  href="/predictions"
                  className="bg-gradient-to-br from-void-graphite to-grail/5 md:hover:from-grail/10 md:hover:to-grail/20 border border-grail/30 md:hover:border-grail/50 text-white font-bold font-mono py-3 px-6 rounded-lg transition-all inline-block active:scale-95"
                >
                  VIEW_ALL_PREDICTIONS
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error Message (for actual errors, not empty state) */}
        {error && prediction && (
          <div className="bg-loss/10 border border-loss rounded-xl p-4 mb-6 text-loss font-mono text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grail-card rounded-2xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-grail border-t-transparent mb-4"></div>
            <p className="text-grail-pale text-lg">Loading predictions...</p>
          </div>
        )}

        {/* Multi-View Mode - Grid of minimalistic cards (works for guests too) */}
        {viewMode === "multi" && allPredictions.length > 0 && !isLoading && (
          <div className="fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allPredictions.map((pred) => {
                const predTotalVotes = pred.sentiment_yes + pred.sentiment_no;
                const predYesPercent = predTotalVotes > 0 ? Math.round((pred.sentiment_yes / predTotalVotes) * 100) : 50;
                const predNoPercent = predTotalVotes > 0 ? Math.round((pred.sentiment_no / predTotalVotes) * 100) : 50;
                const isSwipingThis = swipingCardId === pred.id;
                
                return (
                  <div
                    key={pred.id}
                    className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-lg relative"
                    style={{
                      transform: isSwipingThis ? `translateX(${cardSwipeX}px) rotate(${cardSwipeX / 30}deg)` : 'none',
                      transition: isSwipingThis ? 'none' : 'transform 0.3s ease-out',
                      opacity: isSwipingThis ? Math.max(0.5, 1 - Math.abs(cardSwipeX) / 200) : 1,
                    }}
                    onTouchStart={(e) => handleMiniCardTouchStart(e, pred.id)}
                    onTouchMove={handleMiniCardTouchMove}
                    onTouchEnd={() => handleMiniCardTouchEnd(pred)}
                  >
                    {/* Swipe indicators */}
                    {isSwipingThis && cardSwipeX > 30 && (
                      <div className="absolute inset-0 bg-profit/20 flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-profit text-2xl font-bold font-mono">YES</span>
                      </div>
                    )}
                    {isSwipingThis && cardSwipeX < -30 && (
                      <div className="absolute inset-0 bg-loss/20 flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-loss text-2xl font-bold font-mono">NO</span>
                      </div>
                    )}
                    
                    {/* Card Header */}
                    <div className="p-3 border-b border-grail/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-grail/20 to-grail/5 border border-grail/30 flex items-center justify-center text-sm">
                            {pred.asset_type === "crypto" ? "₿" : "📈"}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold font-mono text-white">{pred.asset}</h4>
                            <p className="text-[10px] text-gray-500 uppercase font-mono">{pred.asset_type}</p>
                          </div>
                        </div>
                        {/* Info Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoModalPrediction(pred);
                          }}
                          className="p-1.5 rounded-md bg-void-graphite/50 border border-grail/20 text-gray-400 hover:text-white hover:border-grail/40 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Question */}
                    <div className="p-3">
                      <p className="text-xs text-gray-300 font-mono leading-relaxed line-clamp-3">
                        {pred.prediction_text}
                      </p>
                    </div>
                    
                    {/* Sentiment Bar (no labels) */}
                    <div className="px-3 pb-2">
                      <div className="relative h-1.5 bg-void-graphite rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-loss transition-all duration-300"
                          style={{ width: `${predNoPercent}%` }}
                        />
                        <div
                          className="absolute right-0 top-0 h-full bg-profit transition-all duration-300"
                          style={{ width: `${predYesPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] font-mono text-gray-500">{predTotalVotes} votes</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="p-2 bg-void-graphite/30 border-t border-grail/20">
                      {isConnected && user ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleMultiViewStake(pred, "NO")}
                            className="bg-loss/20 hover:bg-loss/30 border border-loss/30 text-loss font-bold py-2 rounded-md text-xs font-mono transition-all active:scale-95"
                          >
                            NO
                          </button>
                          <button
                            onClick={() => handleMultiViewStake(pred, "YES")}
                            className="bg-profit/20 hover:bg-profit/30 border border-profit/30 text-profit font-bold py-2 rounded-md text-xs font-mono transition-all active:scale-95"
                          >
                            YES
                          </button>
                        </div>
                      ) : (
                        <ConnectButton.Custom>
                          {({ openConnectModal, mounted }) => (
                            <button
                              onClick={openConnectModal}
                              disabled={!mounted}
                              className="w-full bg-grail/20 hover:bg-grail/30 border border-grail/30 text-grail-light font-bold py-2 rounded-md text-xs font-mono transition-all active:scale-95"
                            >
                              🔐 Connect to Vote
                            </button>
                          )}
                        </ConnectButton.Custom>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Modal */}
        {infoModalPrediction && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setInfoModalPrediction(null)}
          >
            <div 
              className="bg-void-black border border-grail/30 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30 px-4 py-3 flex items-center justify-between sticky top-0">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"></div>
                  <span className="text-gray-400 text-xs font-mono">PREDICTION_DETAILS</span>
                </div>
                <button
                  onClick={() => setInfoModalPrediction(null)}
                  className="p-1 rounded-md hover:bg-grail/20 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {/* Asset */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-grail/20 to-grail/5 border border-grail/30 flex items-center justify-center text-2xl">
                    {infoModalPrediction.asset_type === "crypto" ? "₿" : "📈"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-mono text-white">{infoModalPrediction.asset}</h3>
                    <p className="text-xs text-gray-500 uppercase font-mono">{infoModalPrediction.asset_type}</p>
                  </div>
                </div>
                
                {/* Question */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-grail"></div>
                    <span className="text-xs font-mono text-gray-500 uppercase">Question</span>
                  </div>
                  <p className="text-sm text-gray-200 font-mono leading-relaxed">{infoModalPrediction.prediction_text}</p>
                </div>
                
                {/* Raw Text */}
                {infoModalPrediction.raw_text && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-1 rounded-full bg-auric"></div>
                      <span className="text-xs font-mono text-gray-500 uppercase">Raw_Data</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono leading-relaxed bg-void-graphite/50 p-3 rounded-lg">{infoModalPrediction.raw_text}</p>
                  </div>
                )}
                
                {/* Sentiment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-grail"></div>
                      <span className="text-xs font-mono text-gray-500 uppercase">Sentiment</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{infoModalPrediction.sentiment_yes + infoModalPrediction.sentiment_no} votes</span>
                  </div>
                  <div className="relative h-2 bg-void-graphite rounded-full overflow-hidden mb-2">
                    <div
                      className="absolute left-0 top-0 h-full bg-loss"
                      style={{ width: `${(infoModalPrediction.sentiment_yes + infoModalPrediction.sentiment_no) > 0 ? Math.round((infoModalPrediction.sentiment_no / (infoModalPrediction.sentiment_yes + infoModalPrediction.sentiment_no)) * 100) : 50}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-profit"
                      style={{ width: `${(infoModalPrediction.sentiment_yes + infoModalPrediction.sentiment_no) > 0 ? Math.round((infoModalPrediction.sentiment_yes / (infoModalPrediction.sentiment_yes + infoModalPrediction.sentiment_no)) * 100) : 50}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-loss">{(infoModalPrediction.sentiment_yes + infoModalPrediction.sentiment_no) > 0 ? Math.round((infoModalPrediction.sentiment_no / (infoModalPrediction.sentiment_yes + infoModalPrediction.sentiment_no)) * 100) : 50}% NO</span>
                    <span className="text-profit">{(infoModalPrediction.sentiment_yes + infoModalPrediction.sentiment_no) > 0 ? Math.round((infoModalPrediction.sentiment_yes / (infoModalPrediction.sentiment_yes + infoModalPrediction.sentiment_no)) * 100) : 50}% YES</span>
                  </div>
                </div>
                
                {/* Action Buttons in Modal */}
                {isConnected && user ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        handleMultiViewStake(infoModalPrediction, "NO");
                        setInfoModalPrediction(null);
                      }}
                      className="bg-loss/20 hover:bg-loss/30 border border-loss/30 text-loss font-bold py-3 rounded-lg text-sm font-mono transition-all active:scale-95"
                    >
                      NO
                    </button>
                    <button
                      onClick={() => {
                        handleMultiViewStake(infoModalPrediction, "YES");
                        setInfoModalPrediction(null);
                      }}
                      className="bg-profit/20 hover:bg-profit/30 border border-profit/30 text-profit font-bold py-3 rounded-lg text-sm font-mono transition-all active:scale-95"
                    >
                      YES
                    </button>
                  </div>
                ) : (
                  <ConnectButton.Custom>
                    {({ openConnectModal, mounted }) => (
                      <button
                        onClick={openConnectModal}
                        disabled={!mounted}
                        className="w-full bg-grail/20 hover:bg-grail/30 border border-grail/30 text-grail-light font-bold py-3 rounded-lg text-sm font-mono transition-all active:scale-95"
                      >
                        🔐 Connect Wallet to Vote
                      </button>
                    )}
                  </ConnectButton.Custom>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Single View - Prediction Card - Terminal Style (works for guests too) */}
        {viewMode === "single" && prediction && !isLoading && (
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
                  </>
                )}
                
                {/* Double Tap Skip Animation Overlay */}
                {showSkipAnimation && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none lg:hidden">
                    <div className="animate-ping">
                      <div className="w-20 h-20 rounded-full bg-gray-500/30 flex items-center justify-center">
                        <span className="text-white text-2xl font-mono font-bold">SKIP</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Prediction Card */}
                <div 
                  className="bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl mb-4 lg:mb-0"
                  onClick={handleDoubleTap}
                >
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
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">
                            {prediction.asset_type || "Market"}
                          </p>
                          {prediction.asset_type === "crypto" && prediction.created_price && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-xs text-auric font-bold font-mono tabular-nums">
                                ${prediction.created_price.toFixed(2)}
                              </span>
                            </>
                          )}
                        </div>
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

                {/* User Balance - Only show for connected users */}
                {isConnected && user ? (
                  <div className="p-4 bg-void-graphite/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-500 uppercase">Your_Balance</span>
                      <div className="flex items-center gap-2">
                        {isBalanceLoading ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-auric border-t-transparent"></div>
                            <span className="text-auric font-bold text-lg font-mono tabular-nums opacity-50">
                              {(localBalance ?? user.real_credits_balance).toFixed(3)}
                            </span>
                          </>
                        ) : (
                          <span className="text-auric font-bold text-lg font-mono tabular-nums">
                            {(localBalance ?? user.real_credits_balance).toFixed(3)}
                          </span>
                        )}
                        <span className="text-xs font-mono text-gray-500">USDC</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-grail/5 border-t border-grail/20">
                    <div className="flex items-center justify-center gap-2 text-grail-light text-sm font-mono">
                      <span>🔐</span>
                      <span>Connect wallet to see balance</span>
                    </div>
                  </div>
                )}

                {/* Mobile Sentiment Bar - Only visible on mobile */}
                <div className="md:hidden px-4 py-3 border-t border-grail/20 bg-void-graphite/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-loss"></div>
                      <span className="text-xs font-mono text-gray-500 uppercase">Sentiment</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{totalVotes} votes</span>
                  </div>
                  <div className="relative h-1.5 bg-void-black rounded-full overflow-hidden border border-grail/20">
                    <div
                      className="absolute left-0 top-0 h-full bg-loss transition-all duration-500"
                      style={{ width: `${noPercent}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-profit transition-all duration-500"
                      style={{ width: `${yesPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono font-bold mt-1">
                    <span className="loss-text">{noPercent}%</span>
                    <span className="profit-text">{yesPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Action Panel - Hidden on mobile, shown on desktop */}
              <div className="hidden md:block bg-void-black border border-grail/30 rounded-lg overflow-hidden shadow-xl">
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
                      className="absolute left-0 top-0 h-full bg-loss transition-all duration-500"
                      style={{ width: `${noPercent}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-profit transition-all duration-500"
                      style={{ width: `${yesPercent}%` }}
                    />
                  </div>

                  {/* Percentages */}
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="loss-text">{noPercent}% NO</span>
                    <span className="profit-text">{yesPercent}% YES</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4">
                  {isConnected && user ? (
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleStake("NO")}
                        disabled={bettingClosed || isSubmitting}
                        className="group relative bg-gradient-to-br from-loss to-loss/80 md:hover:from-loss/90 md:hover:to-loss/70 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-lg transition-all md:hover:scale-[1.02] active:scale-95 border border-loss/50 shadow-lg shadow-loss/20 font-mono overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-loss/20 opacity-0 md:group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex flex-col items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-white/80 md:group-hover:bg-white transition-colors"></div>
                          <div className="text-base tracking-wider">{isSubmitting && selectedPosition === "NO" ? "..." : "NO"}</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="group relative bg-void-graphite md:hover:bg-void-graphite/60 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 md:hover:text-white font-bold py-6 rounded-lg transition-all border border-grail/20 md:hover:border-grail/40 font-mono overflow-hidden active:scale-95"
                      >
                        <div className="absolute inset-0 bg-grail/10 opacity-0 md:group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex flex-col items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-500 md:group-hover:bg-gray-300 transition-colors"></div>
                          <div className="text-base tracking-wider">SKIP</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleStake("YES")}
                        disabled={bettingClosed || isSubmitting}
                        className="group relative bg-gradient-to-br from-profit to-profit/80 md:hover:from-profit/90 md:hover:to-profit/70 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-lg transition-all md:hover:scale-[1.02] active:scale-95 border border-profit/50 shadow-lg shadow-profit/20 font-mono overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-profit/20 opacity-0 md:group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex flex-col items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-white/80 md:group-hover:bg-white transition-colors"></div>
                          <div className="text-base tracking-wider">{isSubmitting && selectedPosition === "YES" ? "..." : "YES"}</div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Disabled YES/NO buttons for guests */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-loss/10 border border-loss/20 text-loss/50 font-bold py-4 rounded-lg text-center font-mono cursor-not-allowed">
                          NO
                        </div>
                        <div className="bg-profit/10 border border-profit/20 text-profit/50 font-bold py-4 rounded-lg text-center font-mono cursor-not-allowed">
                          YES
                        </div>
                      </div>
                      {/* Skip button works for guests */}
                      <button
                        onClick={handleSkip}
                        className="w-full group relative bg-void-graphite md:hover:bg-void-graphite/60 text-gray-400 md:hover:text-white font-bold py-3 rounded-lg transition-all border border-grail/20 md:hover:border-grail/40 font-mono overflow-hidden active:scale-95"
                      >
                        <div className="relative flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500 md:group-hover:bg-gray-300 transition-colors"></div>
                          <span>SKIP</span>
                        </div>
                      </button>
                    
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="p-4 bg-void-graphite/30 border-t border-grail/20">
                  <div className="space-y-2 text-xs font-mono text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-loss"></div>
                      <span>NO: Predict outcome won&apos;t occur</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                      <span>SKIP: Pass to next prediction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-profit"></div>
                      <span>YES: Predict outcome will occur</span>
                    </div>
                  </div>
                </div>
              </div>
              </div> {/* Close swipeable container */}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Buttons - Rectangular YES / SKIP / NO row above slider */}
      {viewMode === "single" && prediction && (
        <div
          className={`md:hidden fixed left-0 right-0 z-30 px-4 ${
            isConnected && user
              ? "bottom-[72px] sm:bottom-[88px]" // a bit more gap above slider
              : "bottom-[80px] sm:bottom-[96px]" // guest mode slightly higher above connect CTA
          }`}
        >
          <div className="max-w-sm mx-auto">
            {isConnected && user ? (
              // Connected user - Active YES/NO, active SKIP
              <div className="flex items-center justify-between gap-3">
                {/* NO Button */}
                <button
                  onClick={() => handleStake("NO")}
                  disabled={bettingClosed || isSubmitting}
                  className="flex-1 h-10 rounded-lg bg-void-black disabled:opacity-40 disabled:cursor-not-allowed text-loss font-mono font-bold text-xs tracking-wider transition-all active:scale-95 border border-loss/40 flex items-center justify-center"
                >
                  <span>{isSubmitting && selectedPosition === "NO" ? "..." : "NO"}</span>
                </button>

                {/* SKIP Button */}
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="h-10 px-4 rounded-lg bg-void-graphite disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 font-mono font-bold text-xs tracking-wider transition-all active:scale-95 border border-grail/30 flex items-center justify-center"
                >
                  <span>SKIP</span>
                </button>

                {/* YES Button */}
                <button
                  onClick={() => handleStake("YES")}
                  disabled={bettingClosed || isSubmitting}
                  className="flex-1 h-10 rounded-lg bg-void-black disabled:opacity-40 disabled:cursor-not-allowed text-profit font-mono font-bold text-xs tracking-wider transition-all active:scale-95 border border-profit/40 flex items-center justify-center"
                >
                  <span>{isSubmitting && selectedPosition === "YES" ? "..." : "YES"}</span>
                </button>
              </div>
            ) : (
              // Guest - Disabled YES/NO, active SKIP
              <div className="flex items-center justify-between gap-3">
                {/* NO Button - Disabled */}
                <div className="flex-1 h-10 rounded-lg bg-void-black/60 border border-loss/20 text-loss/30 flex items-center justify-center cursor-not-allowed font-mono font-bold text-xs tracking-wider">
                  <span>NO</span>
                </div>

                {/* SKIP Button - Active for guests */}
                <button
                  onClick={handleSkip}
                  className="h-10 px-4 rounded-lg bg-void-graphite text-gray-300 font-mono font-bold text-xs tracking-wider transition-all active:scale-95 border border-grail/30 flex items-center justify-center"
                >
                  <span>SKIP</span>
                </button>

                {/* YES Button - Disabled */}
                <div className="flex-1 h-10 rounded-lg bg-void-black/60 border border-profit/20 text-profit/30 flex items-center justify-center cursor-not-allowed font-mono font-bold text-xs tracking-wider">
                  <span>YES</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar - Stake Amount Slider (for connected users) or Connect CTA (for guests) */}
      {((viewMode === "single" && prediction) || (viewMode === "multi" && allPredictions.length > 0)) && (
        <div className="fixed bottom-0 left-0 right-0 bg-void-black/95 backdrop-blur-lg border-t border-grail/30 shadow-2xl z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            {!isConnected ? (
              // Guest - Show connect wallet CTA
              <div className="flex items-center justify-center">
                <ConnectButton.Custom>
                  {({ openConnectModal, mounted }) => (
                    <button
                      onClick={openConnectModal}
                      disabled={!mounted}
                      className="flex items-center gap-2 bg-gradient-to-r from-grail to-grail-light hover:from-grail-light hover:to-grail text-white font-bold py-3 px-6 rounded-lg font-mono transition-all active:scale-95 shadow-lg shadow-grail/20"
                    >
                      <span>Connect Wallet to Predict</span>
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : userLoading || !user ? (
              // Connected but user/balance still loading
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="flex items-center gap-2 bg-grail/10 px-4 py-2 rounded-lg border border-grail/30">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-grail border-t-transparent"></div>
                  <span className="text-grail-light text-sm font-mono font-bold">Loading Balance...</span>
                </div>
              </div>
            ) : (user.real_credits_balance || 0) < 1 ? (
              // Connected and loaded, but zero/low balance
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="flex items-center gap-2 bg-loss/10 px-4 py-2 rounded-lg border border-loss/30">
                  <span className="text-loss text-sm font-mono font-bold">Insufficient Balance</span>
                </div>
                <Link
                  href="/wallet"
                  className="bg-gradient-to-r from-auric to-auric/80 text-void-black px-4 py-2 rounded-lg font-mono text-sm font-bold md:hover:from-auric/90 transition-all active:scale-95"
                >
                  Add Balance
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Label - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <div className="w-1 h-1 rounded-full bg-auric"></div>
                  <label className="text-xs font-mono text-gray-500 uppercase whitespace-nowrap">Stake</label>
                </div>

                {/* Slider - Whole numbers only, disabled if balance is 1 */}
                <div className="flex-1 min-w-0">
                  <input
                    type="range"
                    min="1"
                    max={Math.max(1, Math.floor(user?.real_credits_balance || 100))}
                    step="1"
                    value={Math.min(Math.floor(typeof stakeAmount === 'number' ? stakeAmount : parseFloat(stakeAmount) || 1), Math.floor(user?.real_credits_balance || 100))}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    disabled={(user?.real_credits_balance || 0) <= 1}
                    className={`w-full h-2 bg-void-graphite rounded-lg appearance-none slider-thumb ${
                      (user?.real_credits_balance || 0) <= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                    style={{
                      background: (user?.real_credits_balance || 0) <= 1 
                        ? 'rgb(125, 44, 255)'
                        : `linear-gradient(to right, rgb(125, 44, 255) 0%, rgb(125, 44, 255) ${((Math.min(Math.floor(typeof stakeAmount === 'number' ? stakeAmount : parseFloat(stakeAmount) || 1), Math.floor(user?.real_credits_balance || 100)) - 1) / (Math.max(1, Math.floor(user?.real_credits_balance || 100)) - 1)) * 100}%, rgb(31, 41, 55) ${((Math.min(Math.floor(typeof stakeAmount === 'number' ? stakeAmount : parseFloat(stakeAmount) || 1), Math.floor(user?.real_credits_balance || 100)) - 1) / (Math.max(1, Math.floor(user?.real_credits_balance || 100)) - 1)) * 100}%, rgb(31, 41, 55) 100%)`
                    }}
                  />
                </div>

                {/* Manual Input Box - Improved UX */}
                <div className="flex items-center gap-1.5 sm:gap-2 bg-auric/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-auric/30 flex-shrink-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={stakeAmount}
                    onChange={(e) => {
                      const input = e.target.value;
                      
                      // Allow empty string for better UX
                      if (input === '') {
                        setStakeAmount('' as any);
                        return;
                      }
                      
                      // Prevent multiple decimal points
                      const decimalCount = (input.match(/\./g) || []).length;
                      if (decimalCount > 1) {
                        return;
                      }
                      
                      // Only allow numbers and single decimal point
                      if (!/^\d*\.?\d*$/.test(input)) {
                        return;
                      }
                      
                      // Allow partial input like "5." or "0." or just "."
                      if (input.endsWith('.') || input === '.') {
                        setStakeAmount(input as any);
                        return;
                      }
                      
                      const val = parseFloat(input);
                      const maxBalance = user?.real_credits_balance || 100;
                      
                      // Allow any valid number input, only cap when exceeding balance
                      if (!isNaN(val)) {
                        if (val > maxBalance) {
                          setStakeAmount(maxBalance);
                        } else {
                          setStakeAmount(input as any);
                        }
                      } else {
                        setStakeAmount(input as any);
                      }
                    }}
                    onBlur={(e) => {
                      const input = e.target.value;
                      
                      // Handle empty or invalid input
                      if (input === '' || input === '.' || input === '0' || input === '0.') {
                        const balance = user?.real_credits_balance || 0;
                        setStakeAmount(balance < 20 ? Math.min(1, balance) : Math.min(10, balance));
                        return;
                      }
                      
                      const val = parseFloat(input);
                      const maxBalance = user?.real_credits_balance || 100;
                      
                      if (isNaN(val) || val < 1) {
                        const balance = user?.real_credits_balance || 0;
                        setStakeAmount(balance < 20 ? Math.min(1, balance) : Math.min(10, balance));
                      } else if (val > maxBalance) {
                        setStakeAmount(maxBalance);
                      } else {
                        setStakeAmount(val);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-14 sm:w-20 text-auric text-base sm:text-lg font-bold font-mono tabular-nums bg-transparent outline-none text-right"
                  />
                  <span className="text-[10px] sm:text-xs font-mono text-gray-400 whitespace-nowrap">USDC</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
