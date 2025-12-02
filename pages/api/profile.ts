import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * GET /api/profile
 * Fetch user profile data by wallet address
 * If user doesn't exist, create new user with initial credits
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Check if service key is available
  if (!supabaseServiceKey) {
    console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_SERVICE_KEY environment variable");
    return res.status(500).json({ 
      success: false, 
      error: "Server configuration error - missing service key" 
    });
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

    // Use service role key to bypass RLS
    console.log("🔍 Creating Supabase client...");
    console.log("📍 URL:", supabaseUrl);
    console.log("🔑 Service key present:", !!supabaseServiceKey);
    console.log("🔑 Service key length:", supabaseServiceKey?.length);
    console.log("🔑 Service key starts with:", supabaseServiceKey?.substring(0, 20) + "...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey!);

    // Test connection first
    console.log("🧪 Testing Supabase connection...");
    try {
      const { data: testData, error: testError } = await supabase
        .from("users")
        .select("count", { count: "exact", head: true });
      
      console.log("🧪 Connection test result:", { 
        success: !testError, 
        error: testError?.message,
        count: testData 
      });
    } catch (testErr) {
      console.error("🧪 Connection test failed:", testErr);
    }

    // Try to fetch existing user
    console.log("🔍 Fetching user:", normalizedAddress);
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .single();

    console.log("📊 Fetch result:", { 
      hasData: !!existingUser, 
      hasError: !!fetchError,
      errorCode: fetchError?.code,
      errorMessage: fetchError?.message 
    });

    // If user exists, return it
    if (existingUser && !fetchError) {
      console.log("✅ User found:", existingUser.id);
      return res.status(200).json({
        success: true,
        data: { user: existingUser },
      });
    }

    // If error is not "not found", return error
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("❌ Error fetching user:", {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        fullError: JSON.stringify(fetchError, null, 2)
      });
      return res.status(500).json({ 
        success: false, 
        error: `Database error: ${fetchError.message}` 
      });
    }

    console.log("ℹ️ User not found, creating new user...");

    // User doesn't exist - create new user
    const newUser: Omit<User, "id" | "created_at" | "updated_at"> = {
      wallet_address: normalizedAddress,
      real_credits_balance: 2000, // Start with 2000 USDC welcome bonus
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
      console.error("❌ Error creating user:", {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        fullError: JSON.stringify(createError, null, 2)
      });
      return res.status(500).json({ 
        success: false, 
        error: `Failed to create user: ${createError.message}` 
      });
    }

    console.log("✅ User created:", createdUser?.id);

    // Return newly created user
    return res.status(200).json({
      success: true,
      data: { user: createdUser },
    });
  } catch (error) {
    console.error("❌ Profile API catch block error:", error);
    console.error("❌ Error type:", typeof error);
    console.error("❌ Error constructor:", error?.constructor?.name);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack");
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}
