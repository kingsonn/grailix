import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/predictions/stake
 * Record user swipe (YES / NO / SKIP) and stake credits
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { wallet_address, prediction_id, position, stake_credits } = req.body;

    // Validation
    if (!wallet_address || !prediction_id || !position) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (!["YES", "NO", "SKIP"].includes(position)) {
      return res.status(400).json({ success: false, error: "Invalid position" });
    }

    // Normalize wallet address
    const normalizedAddress = wallet_address.toLowerCase().trim();

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Get prediction
    const { data: prediction, error: predictionError } = await supabase
      .from("predictions")
      .select("*")
      .eq("id", prediction_id)
      .single();

    if (predictionError || !prediction) {
      return res.status(404).json({ success: false, error: "Prediction not found" });
    }

    // Validate prediction is pending
    if (prediction.status !== "pending") {
      return res.status(400).json({ success: false, error: "Prediction is not pending" });
    }

    // Validate prediction is not expired
    if (new Date(prediction.expiry_timestamp) <= new Date()) {
      return res.status(400).json({ success: false, error: "Prediction expired" });
    }

    // Check if user already staked on this prediction
    const { data: existingStake, error: stakeCheckError } = await supabase
      .from("user_prediction_stakes")
      .select("id")
      .eq("user_id", user.id)
      .eq("prediction_id", prediction_id)
      .single();

    if (existingStake) {
      return res.status(400).json({ success: false, error: "Already swiped" });
    }

    // Handle SKIP - no credits deducted, no pool updates
    if (position === "SKIP") {
      // Insert stake record with 0 credits
      const { error: insertError } = await supabase
        .from("user_prediction_stakes")
        .insert([
          {
            user_id: user.id,
            prediction_id: prediction_id,
            position: "SKIP",
            stake_credits: 0,
            payout_credits: 0,
          },
        ]);

      if (insertError) {
        console.error("Error inserting SKIP stake:", insertError);
        return res.status(500).json({ success: false, error: "Bulk write failure" });
      }

      return res.status(200).json({
        success: true,
        data: {
          new_balance: user.real_credits_balance,
          updated_sentiment_yes: prediction.sentiment_yes,
          updated_sentiment_no: prediction.sentiment_no,
        },
      });
    }

    // For YES/NO positions - validate stake amount
    if (!stake_credits || stake_credits < 1) {
      return res.status(400).json({ success: false, error: "Invalid stake amount" });
    }

    // Check user has enough credits
    if (user.real_credits_balance < stake_credits) {
      return res.status(400).json({ success: false, error: "Insufficient credits" });
    }

    // Start transaction-like operations
    // 1. Insert stake record
    const { error: insertError } = await supabase
      .from("user_prediction_stakes")
      .insert([
        {
          user_id: user.id,
          prediction_id: prediction_id,
          position: position,
          stake_credits: stake_credits,
          payout_credits: 0,
        },
      ]);

    if (insertError) {
      console.error("Error inserting stake:", insertError);
      return res.status(500).json({ success: false, error: "Bulk write failure" });
    }

    // 2. Update prediction sentiment
    const newSentimentYes = position === "YES" ? prediction.sentiment_yes + 1 : prediction.sentiment_yes;
    const newSentimentNo = position === "NO" ? prediction.sentiment_no + 1 : prediction.sentiment_no;

    const { error: predictionUpdateError } = await supabase
      .from("predictions")
      .update({
        sentiment_yes: newSentimentYes,
        sentiment_no: newSentimentNo,
      })
      .eq("id", prediction_id);

    if (predictionUpdateError) {
      console.error("Error updating prediction sentiment:", predictionUpdateError);
      return res.status(500).json({ success: false, error: "Bulk write failure" });
    }

    // 3. Update or create prediction pool
    const { data: existingPool, error: poolFetchError } = await supabase
      .from("prediction_pools")
      .select("*")
      .eq("prediction_id", prediction_id)
      .single();

    if (poolFetchError && poolFetchError.code !== "PGRST116") {
      console.error("Error fetching pool:", poolFetchError);
      return res.status(500).json({ success: false, error: "Bulk write failure" });
    }

    if (existingPool) {
      // Update existing pool
      const newTotalYes = position === "YES" ? existingPool.total_yes + stake_credits : existingPool.total_yes;
      const newTotalNo = position === "NO" ? existingPool.total_no + stake_credits : existingPool.total_no;

      const { error: poolUpdateError } = await supabase
        .from("prediction_pools")
        .update({
          total_yes: newTotalYes,
          total_no: newTotalNo,
          last_updated: new Date().toISOString(),
        })
        .eq("prediction_id", prediction_id);

      if (poolUpdateError) {
        console.error("Error updating pool:", poolUpdateError);
        return res.status(500).json({ success: false, error: "Bulk write failure" });
      }
    } else {
      // Create new pool
      const { error: poolCreateError } = await supabase
        .from("prediction_pools")
        .insert([
          {
            prediction_id: prediction_id,
            total_yes: position === "YES" ? stake_credits : 0,
            total_no: position === "NO" ? stake_credits : 0,
          },
        ]);

      if (poolCreateError) {
        console.error("Error creating pool:", poolCreateError);
        return res.status(500).json({ success: false, error: "Bulk write failure" });
      }
    }

    // 4. Deduct credits from user
    const newBalance = user.real_credits_balance - stake_credits;

    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        real_credits_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (userUpdateError) {
      console.error("Error updating user balance:", userUpdateError);
      return res.status(500).json({ success: false, error: "Bulk write failure" });
    }

    // Return success with updated values
    return res.status(200).json({
      success: true,
      data: {
        new_balance: newBalance,
        updated_sentiment_yes: newSentimentYes,
        updated_sentiment_no: newSentimentNo,
      },
    });
  } catch (error) {
    console.error("Stake API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
