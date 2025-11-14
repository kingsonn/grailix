import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/wallet/deposit
 * Record deposit transaction from blockchain, credit user
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { wallet_address, amount, tx_hash, internal_deposit_id } = req.body;

    // Validation
    if (!wallet_address || !amount || !tx_hash || !internal_deposit_id) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
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

    // Check if transaction already processed (prevent double-counting)
    const { data: existingTx, error: txCheckError } = await supabase
      .from("transactions")
      .select("id")
      .eq("tx_hash", tx_hash)
      .single();

    if (existingTx) {
      return res.status(400).json({ success: false, error: "Transaction already processed" });
    }

    // Insert transaction record
    const { error: txInsertError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: user.id,
          type: "deposit",
          amount: amount,
          tx_hash: tx_hash,
          status: "confirmed",
        },
      ]);

    if (txInsertError) {
      console.error("Error inserting transaction:", txInsertError);
      return res.status(500).json({ success: false, error: "Failed to record transaction" });
    }

    // Credit user's real_credits_balance
    const newRealBalance = user.real_credits_balance + amount;

    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        real_credits_balance: newRealBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (userUpdateError) {
      console.error("Error updating user balance:", userUpdateError);
      return res.status(500).json({ success: false, error: "Failed to update balance" });
    }

    // Return success with updated balance
    return res.status(200).json({
      success: true,
      data: { real_credits_balance: newRealBalance },
    });
  } catch (error) {
    console.error("Deposit API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
