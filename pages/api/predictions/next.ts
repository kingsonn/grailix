import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/predictions/next
 * Fetch the next pending prediction that user hasn't swiped
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { user_wallet_address, asset_type } = req.query;

    // Validate input
    if (!user_wallet_address || typeof user_wallet_address !== "string") {
      return res.status(400).json({ success: false, error: "user_wallet_address is required" });
    }

    // Validate asset_type if provided
    const validAssetTypes = ["crypto", "stock", "all"];
    const filterAssetType = asset_type && typeof asset_type === "string" ? asset_type.toLowerCase() : "all";
    if (!validAssetTypes.includes(filterAssetType)) {
      return res.status(400).json({ success: false, error: "asset_type must be 'crypto', 'stock', or 'all'" });
    }

    // Normalize wallet address to lowercase
    const normalizedAddress = user_wallet_address.toLowerCase().trim();

    // Get user ID from wallet address
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", normalizedAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Get all prediction IDs the user has already staked on
    const { data: userStakes, error: stakesError } = await supabase
      .from("user_prediction_stakes")
      .select("prediction_id")
      .eq("user_id", user.id);

    if (stakesError) {
      console.error("Error fetching user stakes:", stakesError);
      return res.status(500).json({ success: false, error: "DB fetch failure" });
    }

    // Extract prediction IDs user has already swiped
    const swipedPredictionIds = userStakes?.map((stake) => stake.prediction_id) || [];

    // Fetch next available prediction
    let query = supabase
      .from("predictions")
      .select("id, prediction_text, source_name, source_category, asset, asset_type, raw_text, expiry_timestamp, sentiment_yes, sentiment_no")
      .eq("status", "pending")
      .gt("expiry_timestamp", new Date().toISOString())
      .order("created_timestamp", { ascending: true });

    // Filter by asset_type if not 'all'
    if (filterAssetType !== "all") {
      query = query.eq("asset_type", filterAssetType);
    }

    // Exclude predictions user has already swiped
    if (swipedPredictionIds.length > 0) {
      query = query.not("id", "in", `(${swipedPredictionIds.join(",")})`);
    }

    const { data: predictions, error: predictionError } = await query.limit(1);

    if (predictionError) {
      console.error("Error fetching predictions:", predictionError);
      return res.status(500).json({ success: false, error: "DB fetch failure" });
    }

    // If no predictions available, return null
    if (!predictions || predictions.length === 0) {
      return res.status(200).json({
        success: true,
        data: { prediction: null },
      });
    }

    // Return the first prediction
    return res.status(200).json({
      success: true,
      data: { prediction: predictions[0] },
    });
  } catch (error) {
    console.error("Next prediction API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
