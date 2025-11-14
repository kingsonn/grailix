import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@/types/supabase";

/**
 * GET /api/profile
 * Fetch user profile data by wallet address
 * If user doesn't exist, create new user with initial credits
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { wallet_address } = req.query;

    // Validate wallet_address
    if (!wallet_address || typeof wallet_address !== "string") {
      return res.status(400).json({ success: false, error: "wallet_address is required" });
    }

    if (!wallet_address.trim()) {
      return res.status(400).json({ success: false, error: "wallet_address cannot be empty" });
    }

    // Normalize wallet address to lowercase
    const normalizedAddress = wallet_address.toLowerCase().trim();

    // Try to fetch existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .single();

    // If user exists, return it
    if (existingUser && !fetchError) {
      return res.status(200).json({
        success: true,
        data: { user: existingUser },
      });
    }

    // If error is not "not found", return error
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    // User doesn't exist - create new user with initial credits
    const newUser: Omit<User, "id" | "created_at" | "updated_at"> = {
      wallet_address: normalizedAddress,
      credits_balance: 100, // Free trial credits
      real_credits_balance: 0,
      xp: 0,
      streak: 0,
      accuracy: 0,
    };

    const { data: createdUser, error: createError } = await supabase
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      return res.status(500).json({ success: false, error: "Failed to create user" });
    }

    // Return newly created user
    return res.status(200).json({
      success: true,
      data: { user: createdUser },
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
