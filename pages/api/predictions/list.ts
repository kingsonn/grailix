// pages/api/predictions/list.ts
/**
 * Fetch multiple active predictions for multi-view mode
 * Query params:
 *   ?user_wallet_address=0x... - Optional (for filtering user's staked predictions)
 *   ?asset_type=all|stock|crypto - Filter by asset type
 *   ?exclude_ids=1,2,3 - Exclude specific prediction IDs
 *   ?limit=20 - Number of predictions to fetch
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { user_wallet_address, asset_type, exclude_ids, limit } = req.query;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date().toISOString();
    const maxLimit = Math.min(parseInt(limit as string) || 20, 50);

    // Parse excluded IDs
    const excludedIds: number[] = [];
    if (exclude_ids && typeof exclude_ids === "string") {
      excludedIds.push(...exclude_ids.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id)));
    }

    // Get user's staked predictions only if wallet address is provided
    let stakedPredictionIds: number[] = [];
    if (user_wallet_address && typeof user_wallet_address === "string") {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", user_wallet_address.toLowerCase())
        .single();

      if (userData?.id) {
        const { data: userStakes } = await supabase
          .from("user_prediction_stakes")
          .select("prediction_id")
          .eq("user_id", userData.id);

        stakedPredictionIds = userStakes?.map(s => s.prediction_id) || [];
      }
    }

    const allExcludedIds = [...new Set([...excludedIds, ...stakedPredictionIds])];

    // Build query for active predictions
    let query = supabase
      .from("predictions")
      .select(`
        id,
        prediction_text,
        asset,
        asset_type,
        raw_text,
        direction,
        reference_type,
        created_price,
        expiry_timestamp,
        betting_close,
        sentiment_yes,
        sentiment_no
      `)
      .gt("expiry_timestamp", now)
      .gt("betting_close", now)
      .eq("status", "pending")
      .order("created_timestamp", { ascending: false })
      .limit(maxLimit);

    // Filter by asset type
    if (asset_type && asset_type !== "all") {
      query = query.eq("asset_type", asset_type);
    }

    // Exclude specific IDs
    if (allExcludedIds.length > 0) {
      query = query.not("id", "in", `(${allExcludedIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching predictions:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      data: {
        predictions: data || [],
        count: data?.length || 0,
      },
    });
  } catch (error: any) {
    console.error("Predictions list error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
