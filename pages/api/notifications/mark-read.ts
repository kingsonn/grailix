// pages/api/notifications/mark-read.ts
/**
 * Mark notification(s) as read
 * Body:
 *   { notification_id: number } - Mark single notification as read
 *   { mark_all: true } - Mark all notifications as read
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { wallet_address, notification_id, mark_all } = req.body;
  
  if (!wallet_address) {
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

    if (mark_all) {
      // Mark all notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", publicUser.id)
        .eq("read", false);

      if (error) {
        console.error("Error marking all as read:", error);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (notification_id) {
      // Mark single notification as read
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notification_id)
        .eq("user_id", publicUser.id);

      if (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Either notification_id or mark_all must be provided",
      });
    }
  } catch (error: any) {
    console.error("Mark read error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
