import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/leaderboard
 * Fetch top users sorted by XP
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Fetch top users ordered by XP
    const { data: users, error } = await supabase
      .from("users")
      .select("wallet_address, xp, streak, accuracy")
      .order("xp", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
    }

    return res.status(200).json({
      success: true,
      data: { leaderboard: users || [] },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
