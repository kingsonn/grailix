// pages/api/notifications/list.ts
/**
 * Fetch user's notifications
 * Query params:
 *   ?limit=20 - Number of notifications to fetch (default: 20)
 *   ?unread_only=true - Only fetch unread notifications
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { wallet_address, limit = "20", unread_only } = req.query;
  
  if (!wallet_address || typeof wallet_address !== "string") {
    return res.status(400).json({ success: false, error: "wallet_address is required" });
  }

  // Use service role key to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get public.users ID from wallet address
    const { data: publicUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", wallet_address.toLowerCase())
      .single();

    if (userError || !publicUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const limitNum = parseInt(limit as string, 10);

    let query = supabase
      .from("notifications")
      .select(`
        id,
        prediction_id,
        type,
        title,
        message,
        payout_amount,
        read,
        created_at,
        predictions (
          id,
          prediction_text,
          asset,
          outcome_value
        )
      `)
      .eq("user_id", publicUser.id)
      .order("created_at", { ascending: false })
      .limit(limitNum);

    if (unread_only === "true") {
      query = query.eq("read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      notifications: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error("Notifications fetch error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
