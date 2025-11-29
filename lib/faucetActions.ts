"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
);

export interface ClaimStatus {
  canClaim: boolean;
  nextClaimTime: string | null;
  lastClaimTime: string | null;
  timeRemaining: number | null; // milliseconds until next claim
}

/**
 * Check if a wallet can claim from the faucet
 */
export async function checkClaimStatus(walletAddress: string): Promise<ClaimStatus> {
  try {
    // Get the most recent claim for this wallet
    const { data: lastClaim, error } = await supabase
      .from("faucet_claims")
      .select("claimed_at")
      .eq("wallet_address", walletAddress.toLowerCase())
      .order("claimed_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine
      console.error("Error checking claim status:", error);
      throw error;
    }

    // If no previous claim, user can claim
    if (!lastClaim) {
      return {
        canClaim: true,
        nextClaimTime: null,
        lastClaimTime: null,
        timeRemaining: null,
      };
    }

    const lastClaimTime = new Date(lastClaim.claimed_at);
    const nextClaimTime = new Date(lastClaimTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
    const now = new Date();
    const canClaim = now >= nextClaimTime;
    const timeRemaining = canClaim ? 0 : nextClaimTime.getTime() - now.getTime();

    return {
      canClaim,
      nextClaimTime: nextClaimTime.toISOString(),
      lastClaimTime: lastClaimTime.toISOString(),
      timeRemaining,
    };
  } catch (error) {
    console.error("Error in checkClaimStatus:", error);
    throw error;
  }
}

/**
 * Record a faucet claim
 */
export async function recordClaim(
  walletAddress: string,
  userId: string,
  amount: number,
  txHash?: string
): Promise<void> {
  try {
    const { error } = await supabase.from("faucet_claims").insert({
      user_id: userId,
      wallet_address: walletAddress.toLowerCase(),
      amount,
      tx_hash: txHash || null,
      claimed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error recording claim:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in recordClaim:", error);
    throw error;
  }
}
