// pages/api/dev/force-expire.ts
/**
 * Developer-only endpoint to force-expire a prediction for testing
 * Sets expiry_timestamp and betting_close to NOW() - 1 minute
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ success: false, error: "Not available in production" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { prediction_id } = req.body;

  if (!prediction_id || typeof prediction_id !== "number") {
    return res.status(400).json({ success: false, error: "Invalid prediction_id" });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate timestamp 1 minute in the past
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

    // Update the prediction
    const { data, error } = await supabase
      .from("predictions")
      .update({
        expiry_timestamp: oneMinuteAgo,
        betting_close: oneMinuteAgo,
      })
      .eq("id", prediction_id)
      .select()
      .single();

    if (error) {
      console.error("Error force-expiring prediction:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`✅ Force-expired prediction ${prediction_id}`);

    return res.status(200).json({
      success: true,
      prediction: data,
      message: `Prediction ${prediction_id} expired at ${oneMinuteAgo}`,
    });
  } catch (error: any) {
    console.error("Force-expire error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
