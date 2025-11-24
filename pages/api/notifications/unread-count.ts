// pages/api/notifications/unread-count.ts
/**
 * Get count of unread notifications for the current user
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { wallet_address } = req.query;
  
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

    // Get unread count
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", publicUser.id)
      .eq("read", false);

    if (error) {
      console.error("Error fetching unread count:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      unread_count: count || 0,
    });
  } catch (error: any) {
    console.error("Unread count fetch error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
