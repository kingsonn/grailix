// pages/api/predictions/all.ts
/**
 * Fetch predictions by status type
 * Query params:
 *   ?type=active - expiry > now AND betting_close > now
 *   ?type=expired - expiry < now AND status='pending'
 *   ?type=resolved - status='resolved'
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { type } = req.query;

  if (!type || typeof type !== "string") {
    return res.status(400).json({ success: false, error: "Missing or invalid 'type' query param" });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date().toISOString();

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
        status,
        outcome_value,
        resolved_price,
        resolved_timestamp,
        resolution_report,
        sentiment_yes,
        sentiment_no,
        created_timestamp
      `)
      .order("created_timestamp", { ascending: false })
      .limit(100);

    if (type === "active") {
      // Active: expiry > now AND betting_close > now
      query = query
        .gt("expiry_timestamp", now)
        .gt("betting_close", now)
        .eq("status", "pending");
    } else if (type === "expired") {
      // Expired (awaiting resolution): expiry < now AND status='pending'
      query = query
        .lt("expiry_timestamp", now)
        .eq("status", "pending");
    } else if (type === "resolved") {
      // Resolved: status='resolved'
      query = query.eq("status", "resolved");
    } else {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid type. Must be 'active', 'expired', or 'resolved'" 
      });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${type} predictions:`, error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      type,
      count: data?.length || 0,
      predictions: data || [],
    });
  } catch (error: any) {
    console.error("Predictions fetch error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
