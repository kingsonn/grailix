import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/user/history
 * Fetch user's prediction history with stakes and outcomes
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== "string") {
      return res.status(400).json({ success: false, error: "user_id is required" });
    }

    // Fetch user's stakes with prediction details
    const { data: stakes, error: stakesError } = await supabase
      .from("user_prediction_stakes")
      .select(`
        prediction_id,
        position,
        stake_credits,
        payout_credits,
        created_at,
        resolved_at
      `)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (stakesError) {
      console.error("Error fetching stakes:", stakesError);
      return res.status(500).json({ success: false, error: "Failed to fetch history" });
    }

    if (!stakes || stakes.length === 0) {
      return res.status(200).json({
        success: true,
        data: { history: [] },
      });
    }

    // Get all prediction IDs
    const predictionIds = stakes.map((s) => s.prediction_id);

    // Fetch prediction details
    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select(`
        id,
        prediction_text,
        asset,
        expiry_timestamp,
        status,
        outcome_value,
        resolved_price,
        resolved_timestamp,
        resolution_report
      `)
      .in("id", predictionIds);

    if (predictionsError) {
      console.error("Error fetching predictions:", predictionsError);
      return res.status(500).json({ success: false, error: "Failed to fetch predictions" });
    }

    // Merge stakes with predictions
    const history = stakes.map((stake) => {
      const prediction = predictions?.find((p) => p.id === stake.prediction_id);
      return {
        id: stake.prediction_id,
        prediction_text: prediction?.prediction_text || "",
        asset: prediction?.asset || "",
        position: stake.position,
        stake_credits: stake.stake_credits,
        payout_credits: stake.payout_credits,
        outcome_value: prediction?.outcome_value,
        resolved_price: prediction?.resolved_price,
        resolved_timestamp: prediction?.resolved_timestamp,
        resolution_report: prediction?.resolution_report,
        expiry_timestamp: prediction?.expiry_timestamp || "",
        status: prediction?.status || "pending",
      };
    });

    return res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error("History API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
