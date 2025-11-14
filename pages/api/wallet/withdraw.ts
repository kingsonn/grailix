import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";

// Contract addresses
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as string;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;
const PRIVATE_KEY = process.env.VAULT_PRIVATE_KEY as string;

// GrailixVault ABI (minimal for withdraw)
const VAULT_ABI = [
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "internalWithdrawId", type: "string" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

/**
 * POST /api/wallet/withdraw
 * Process withdrawal request - deduct balance and execute on-chain
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { wallet_address, amount } = req.body;

    // Validation
    if (!wallet_address || !amount) {
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

    // Check sufficient balance
    if (user.real_credits_balance < amount) {
      return res.status(400).json({ success: false, error: "Insufficient funds" });
    }

    // Generate internal withdraw ID
    const internalWithdrawId = uuidv4();

    // Deduct from user balance
    const newRealBalance = user.real_credits_balance - amount;

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

    // Insert pending transaction record
    const { data: txData, error: txInsertError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: user.id,
          type: "withdraw",
          amount: amount,
          status: "pending",
          tx_hash: null, // Will be updated after blockchain tx
        },
      ])
      .select()
      .single();

    if (txInsertError || !txData) {
      console.error("Error inserting transaction:", txInsertError);
      return res.status(500).json({ success: false, error: "Failed to record transaction" });
    }

    // Execute blockchain withdrawal
    try {
      // Setup provider and signer
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

      // Convert amount to wei (assuming 18 decimals)
      const amountWei = ethers.parseUnits(amount.toString(), 18);

      // Call withdraw function
      const tx = await vaultContract.withdraw(
        normalizedAddress,
        amountWei,
        internalWithdrawId
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Update transaction with tx_hash and confirmed status
      await supabase
        .from("transactions")
        .update({
          tx_hash: receipt.hash,
          status: "confirmed",
        })
        .eq("id", txData.id);

      return res.status(200).json({
        success: true,
        data: {
          status: "confirmed",
          tx_hash: receipt.hash,
          new_balance: newRealBalance,
        },
      });
    } catch (contractError) {
      console.error("Blockchain withdrawal error:", contractError);

      // Rollback: refund user balance
      await supabase
        .from("users")
        .update({
          real_credits_balance: user.real_credits_balance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      // Update transaction status to failed
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", txData.id);

      return res.status(500).json({
        success: false,
        error: "Blockchain withdrawal failed",
      });
    }
  } catch (error) {
    console.error("Withdraw API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
