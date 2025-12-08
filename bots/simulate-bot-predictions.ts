// bots/simulate-bot-predictions.ts
/**
 * Bot Prediction Simulator
 * 
 * This script simulates 50 bot accounts placing random YES/NO predictions
 * on all active predictions in the platform.
 * 
 * Features:
 * - Fetches all bot users (identified by credits_balance = 999)
 * - Fetches all active predictions (status = 'pending' and expiry_timestamp > now)
 * - Each bot randomly picks YES or NO for each prediction
 * - Random stake amounts between 10-100 credits for variety
 * - Prevents duplicate stakes (checks existing stakes first)
 * - Provides detailed logging and statistics
 * 
 * ENV variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_SERVICE_KEY
 * 
 * Usage:
 *   npm run bot:simulate
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY) {
  throw new Error("Missing required Supabase environment variables");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
);

interface BotUser {
  id: string;
  wallet_address: string;
  real_credits_balance: number;
}

interface Prediction {
  id: number;
  prediction_text: string;
  expiry_timestamp: string;
  sentiment_yes: number;
  sentiment_no: number;
}

interface StakeResult {
  success: boolean;
  userId: string;
  predictionId: number;
  position: string;
  stake: number;
  error?: string;
}

/**
 * Fetch all bot users (identified by credits_balance = 999)
 */
async function fetchBotUsers(): Promise<BotUser[]> {
  console.log("📥 Fetching bot users...");
  
  const { data, error } = await supabase
    .from("users")
    .select("id, wallet_address, real_credits_balance")
    .eq("credits_balance", 999);

  if (error) {
    throw new Error(`Failed to fetch bot users: ${error.message}`);
  }

  console.log(`✅ Found ${data?.length || 0} bot users`);
  return data || [];
}

/**
 * Fetch all active predictions
 * Active = status is 'pending' and expiry_timestamp is in the future
 */
async function fetchActivePredictions(): Promise<Prediction[]> {
  console.log("📥 Fetching active predictions...");
  
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from("predictions")
    .select("id, prediction_text, expiry_timestamp, sentiment_yes, sentiment_no")
    .eq("status", "pending")
    .gt("expiry_timestamp", now);

  if (error) {
    throw new Error(`Failed to fetch predictions: ${error.message}`);
  }

  console.log(`✅ Found ${data?.length || 0} active predictions`);
  return data || [];
}

/**
 * Check if a user has already staked on a prediction
 */
async function hasExistingStake(userId: string, predictionId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_prediction_stakes")
    .select("id")
    .eq("user_id", userId)
    .eq("prediction_id", predictionId)
    .limit(1);

  if (error) {
    console.error(`⚠️  Error checking existing stake: ${error.message}`);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Generate a random stake amount between min and max
 */
function getRandomStake(min: number = 10, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Randomly pick YES or NO
 */
function getRandomPosition(): "YES" | "NO" {
  return Math.random() > 0.5 ? "YES" : "NO";
}

/**
 * Update prediction_pools table with new stake
 */
async function updatePredictionPool(
  predictionId: number,
  position: "YES" | "NO",
  stakeAmount: number
): Promise<void> {
  try {
    // First, check if pool exists (get first match in case of duplicates)
    const { data: existingPools } = await supabase
      .from("prediction_pools")
      .select("id, total_yes, total_no")
      .eq("prediction_id", predictionId)
      .limit(1);

    if (existingPools && existingPools.length > 0) {
      const existingPool = existingPools[0];
      // Update existing pool
      const updates = position === "YES" 
        ? { total_yes: (existingPool.total_yes || 0) + stakeAmount }
        : { total_no: (existingPool.total_no || 0) + stakeAmount };
      
      await supabase
        .from("prediction_pools")
        .update({ ...updates, last_updated: new Date().toISOString() })
        .eq("id", existingPool.id);
    } else {
      // Create new pool
      await supabase
        .from("prediction_pools")
        .insert({
          prediction_id: predictionId,
          total_yes: position === "YES" ? stakeAmount : 0,
          total_no: position === "NO" ? stakeAmount : 0,
          last_updated: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error(`⚠️  Failed to update prediction pool: ${error}`);
  }
}

/**
 * Update predictions table sentiment counts
 */
async function updatePredictionSentiment(
  predictionId: number,
  position: "YES" | "NO"
): Promise<void> {
  try {
    // Fetch current sentiment
    const { data: prediction } = await supabase
      .from("predictions")
      .select("sentiment_yes, sentiment_no")
      .eq("id", predictionId)
      .single();

    if (prediction) {
      const updates = position === "YES"
        ? { sentiment_yes: (prediction.sentiment_yes || 0) + 1 }
        : { sentiment_no: (prediction.sentiment_no || 0) + 1 };
      
      await supabase
        .from("predictions")
        .update(updates)
        .eq("id", predictionId);
    }
  } catch (error) {
    console.error(`⚠️  Failed to update prediction sentiment: ${error}`);
  }
}

/**
 * Place a stake for a bot user on a prediction
 */
async function placeStake(
  userId: string,
  predictionId: number,
  position: "YES" | "NO",
  stakeAmount: number
): Promise<StakeResult> {
  try {
    // Check if stake already exists
    const exists = await hasExistingStake(userId, predictionId);
    if (exists) {
      return {
        success: false,
        userId,
        predictionId,
        position,
        stake: stakeAmount,
        error: "Stake already exists"
      };
    }

    // Check if bot has enough balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("real_credits_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        userId,
        predictionId,
        position,
        stake: stakeAmount,
        error: "Failed to fetch user balance"
      };
    }

    if (user.real_credits_balance < stakeAmount) {
      return {
        success: false,
        userId,
        predictionId,
        position,
        stake: stakeAmount,
        error: `Insufficient balance (${user.real_credits_balance} < ${stakeAmount})`
      };
    }

    // Insert the stake
    const { error } = await supabase
      .from("user_prediction_stakes")
      .insert({
        user_id: userId,
        prediction_id: predictionId,
        position: position,
        stake_credits: stakeAmount,
        payout_credits: null,
        resolved_at: null
      });

    if (error) {
      return {
        success: false,
        userId,
        predictionId,
        position,
        stake: stakeAmount,
        error: error.message
      };
    }

    // CRITICAL: Deduct stake from user's balance
    const { error: deductError } = await supabase
      .from("users")
      .update({ 
        real_credits_balance: user.real_credits_balance - stakeAmount,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (deductError) {
      console.error(`⚠️ Failed to deduct stake from user ${userId}: ${deductError.message}`);
      // Note: stake is already inserted, but balance wasn't deducted - this is a partial failure
    }

    // Log the stake transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "stake",
      amount: -stakeAmount, // Negative for deduction
      status: "confirmed",
    });

    // Update prediction_pools and predictions tables
    await Promise.all([
      updatePredictionPool(predictionId, position, stakeAmount),
      updatePredictionSentiment(predictionId, position)
    ]);

    return {
      success: true,
      userId,
      predictionId,
      position,
      stake: stakeAmount
    };
  } catch (err) {
    return {
      success: false,
      userId,
      predictionId,
      position,
      stake: stakeAmount,
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }
}

/**
 * Simulate all bot predictions
 */
async function simulateBotPredictions() {
  console.log("🤖 Starting bot prediction simulation...\n");

  // Fetch data
  const [botUsers, predictions] = await Promise.all([
    fetchBotUsers(),
    fetchActivePredictions()
  ]);

  if (botUsers.length === 0) {
    console.log("⚠️  No bot users found. Please run insert-fake-users.sql first.");
    return;
  }

  if (predictions.length === 0) {
    console.log("⚠️  No active predictions found. Nothing to stake on.");
    return;
  }

  console.log(`\n🎯 Simulating stakes for ${botUsers.length} bots on ${predictions.length} predictions...\n`);

  // Statistics
  let totalStakes = 0;
  let successfulStakes = 0;
  let skippedStakes = 0;
  let failedStakes = 0;
  const results: StakeResult[] = [];

  // Process each bot
  for (let i = 0; i < botUsers.length; i++) {
    const bot = botUsers[i];
    console.log(`\n[${i + 1}/${botUsers.length}] Processing bot: ${bot.wallet_address.substring(0, 10)}...`);

    // Place stakes on all predictions
    for (const prediction of predictions) {
      totalStakes++;
      
      const position = getRandomPosition();
      const stakeAmount = getRandomStake(10, 100);

      const result = await placeStake(bot.id, prediction.id, position, stakeAmount);
      results.push(result);

      if (result.success) {
        successfulStakes++;
        console.log(`  ✅ Prediction #${prediction.id}: ${position} with ${stakeAmount} credits`);
      } else if (result.error === "Stake already exists") {
        skippedStakes++;
        console.log(`  ⏭️  Prediction #${prediction.id}: Already staked`);
      } else {
        failedStakes++;
        console.log(`  ❌ Prediction #${prediction.id}: Failed - ${result.error}`);
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SIMULATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total stake attempts:     ${totalStakes}`);
  console.log(`✅ Successful stakes:     ${successfulStakes}`);
  console.log(`⏭️  Skipped (duplicates):  ${skippedStakes}`);
  console.log(`❌ Failed stakes:         ${failedStakes}`);
  console.log("=".repeat(60));

  // Calculate position distribution
  const yesCount = results.filter(r => r.success && r.position === "YES").length;
  const noCount = results.filter(r => r.success && r.position === "NO").length;
  
  console.log("\n📈 POSITION DISTRIBUTION");
  console.log("=".repeat(60));
  console.log(`YES positions: ${yesCount} (${((yesCount / successfulStakes) * 100).toFixed(1)}%)`);
  console.log(`NO positions:  ${noCount} (${((noCount / successfulStakes) * 100).toFixed(1)}%)`);
  console.log("=".repeat(60));

  // Calculate total credits staked
  const totalCreditsStaked = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.stake, 0);
  
  console.log("\n💰 CREDITS STAKED");
  console.log("=".repeat(60));
  console.log(`Total credits staked: ${totalCreditsStaked}`);
  console.log(`Average per stake:    ${(totalCreditsStaked / successfulStakes).toFixed(2)}`);
  console.log("=".repeat(60));

  console.log("\n✨ Bot simulation completed!\n");
}

/**
 * Main execution
 */
async function main() {
  try {
    await simulateBotPredictions();
  } catch (error) {
    console.error("\n❌ Error during simulation:");
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
