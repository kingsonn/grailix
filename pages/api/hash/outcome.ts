import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/hash/outcome
 * Store outcome hash on-chain and in database
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { prediction_id, outcome_hash } = req.body;

    if (!prediction_id || !outcome_hash) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // TODO: Implement hash storage logic:
    // 1. Call smart contract storeOutcomeHash
    // 2. Update prediction record with outcome hash

    return res.status(200).json({
      success: true,
      data: { message: "Outcome hash stored (placeholder)" },
    });
  } catch (error) {
    console.error("Outcome hash API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
