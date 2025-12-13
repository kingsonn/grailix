import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/leaderboard/user-rank
 * Fetch a specific user's rank and stats
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { wallet } = req.query;

  if (!wallet || typeof wallet !== "string") {
    return res.status(400).json({ success: false, error: "Wallet address required" });
  }

  try {
    // First, get the user's XP
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_address, xp, streak, accuracy")
      .eq("wallet_address", wallet.toLowerCase())
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Count how many users have more XP than this user
    const { count, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("xp", user.xp);

    if (countError) {
      console.error("Error counting users:", countError);
      return res.status(500).json({ success: false, error: "Failed to calculate rank" });
    }

    // Rank is count + 1 (users with more XP + 1)
    const rank = (count || 0) + 1;

    return res.status(200).json({
      success: true,
      data: {
        rank,
        entry: user,
      },
    });
  } catch (error) {
    console.error("User rank API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
