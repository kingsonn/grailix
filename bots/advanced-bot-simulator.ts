// bots/advanced-bot-simulator.ts
/**
 * Advanced Bot Prediction Simulator
 * 
 * Enhanced version with more realistic bot behavior patterns:
 * - Bot personalities (aggressive, conservative, balanced)
 * - Time-delayed stakes (spreads over time)
 * - Sentiment-aware positioning (bots influenced by current sentiment)
 * - Variable participation rate (not all bots stake on all predictions)
 * 
 * ENV variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_SERVICE_KEY
 * 
 * Usage:
 *   npm run bot:advanced
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY) {
  throw new Error("Missing required Supabase environment variables");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
);

// Configuration
const CONFIG = {
  // Percentage of bots that will participate (70-95%)
  participationRateMin: 0.7,
  participationRateMax: 0.95,
  
  // Delay between stakes (milliseconds)
  minDelay: 100,
  maxDelay: 500,
  
  // Stake amounts by personality
  stakeRanges: {
    conservative: { min: 10, max: 50 },
    balanced: { min: 30, max: 80 },
    aggressive: { min: 50, max: 150 }
  },
  
  // Sentiment influence (0-1, higher = more influenced by current sentiment)
  sentimentInfluence: 0.3
};

type BotPersonality = "conservative" | "balanced" | "aggressive";

interface BotUser {
  id: string;
  wallet_address: string;
  real_credits_balance: number;
  personality?: BotPersonality;
}

interface Prediction {
  id: number;
  prediction_text: string;
  expiry_timestamp: string;
  sentiment_yes: number;
  sentiment_no: number;
}

/**
 * Assign a random personality to each bot
 */
function assignPersonality(): BotPersonality {
  const rand = Math.random();
  if (rand < 0.2) return "conservative";  // 20%
  if (rand < 0.7) return "balanced";      // 50%
  return "aggressive";                     // 30%
}

/**
 * Fetch bot users and assign personalities
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

  const botsWithPersonality = (data || []).map(bot => ({
    ...bot,
    personality: assignPersonality()
  }));

  console.log(`✅ Found ${botsWithPersonality.length} bot users`);
  
  // Show personality distribution
  const personalities = botsWithPersonality.reduce((acc, bot) => {
    acc[bot.personality!] = (acc[bot.personality!] || 0) + 1;
    return acc;
  }, {} as Record<BotPersonality, number>);
  
  console.log("🎭 Personality distribution:");
  console.log(`   Conservative: ${personalities.conservative || 0}`);
  console.log(`   Balanced: ${personalities.balanced || 0}`);
  console.log(`   Aggressive: ${personalities.aggressive || 0}`);
  
  return botsWithPersonality;
}

/**
 * Fetch active predictions
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
 * Check if user already has a stake
 */
async function hasExistingStake(userId: string, predictionId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_prediction_stakes")
    .select("id")
    .eq("user_id", userId)
    .eq("prediction_id", predictionId)
    .limit(1);

  if (error) return false;
  return (data?.length || 0) > 0;
}

/**
 * Get stake amount based on personality
 */
function getStakeAmount(personality: BotPersonality): number {
  const range = CONFIG.stakeRanges[personality];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

/**
 * Determine position based on sentiment and randomness
 * Higher sentiment_yes means more likely to pick YES
 */
function getPosition(prediction: Prediction): "YES" | "NO" {
  const totalSentiment = prediction.sentiment_yes + prediction.sentiment_no;
  
  if (totalSentiment === 0) {
    // No sentiment data, pure random
    return Math.random() > 0.5 ? "YES" : "NO";
  }
  
  // Calculate sentiment ratio (0-1, higher = more YES sentiment)
  const yesSentimentRatio = prediction.sentiment_yes / totalSentiment;
  
  // Mix sentiment with randomness based on influence factor
  const randomFactor = Math.random();
  const sentimentFactor = yesSentimentRatio;
  const finalScore = (sentimentFactor * CONFIG.sentimentInfluence) + 
                     (randomFactor * (1 - CONFIG.sentimentInfluence));
  
  return finalScore > 0.5 ? "YES" : "NO";
}

/**
 * Decide if bot should participate in this prediction
 */
function shouldParticipate(): boolean {
  const rate = CONFIG.participationRateMin + 
               (Math.random() * (CONFIG.participationRateMax - CONFIG.participationRateMin));
  return Math.random() < rate;
}

/**
 * Get random delay between stakes
 */
function getRandomDelay(): number {
  return Math.floor(
    Math.random() * (CONFIG.maxDelay - CONFIG.minDelay + 1)
  ) + CONFIG.minDelay;
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
 * Place a stake
 */
async function placeStake(
  userId: string,
  predictionId: number,
  position: "YES" | "NO",
  stakeAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const exists = await hasExistingStake(userId, predictionId);
    if (exists) {
      return { success: false, error: "Already staked" };
    }

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
      return { success: false, error: error.message };
    }

    // Update prediction_pools and predictions tables
    await Promise.all([
      updatePredictionPool(predictionId, position, stakeAmount),
      updatePredictionSentiment(predictionId, position)
    ]);

    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error" 
    };
  }
}

/**
 * Main simulation function
 */
async function runAdvancedSimulation() {
  console.log("🤖 Starting advanced bot prediction simulation...\n");

  const [botUsers, predictions] = await Promise.all([
    fetchBotUsers(),
    fetchActivePredictions()
  ]);

  if (botUsers.length === 0) {
    console.log("⚠️  No bot users found.");
    return;
  }

  if (predictions.length === 0) {
    console.log("⚠️  No active predictions found.");
    return;
  }

  console.log(`\n🎯 Starting simulation...\n`);

  let stats = {
    total: 0,
    successful: 0,
    skipped: 0,
    failed: 0,
    yesCount: 0,
    noCount: 0,
    totalCredits: 0,
    byPersonality: {
      conservative: { count: 0, credits: 0 },
      balanced: { count: 0, credits: 0 },
      aggressive: { count: 0, credits: 0 }
    }
  };

  // Process each prediction
  for (let i = 0; i < predictions.length; i++) {
    const prediction = predictions[i];
    console.log(`\n[${i + 1}/${predictions.length}] Prediction #${prediction.id}`);
    console.log(`   "${prediction.prediction_text.substring(0, 60)}..."`);
    console.log(`   Current sentiment: YES=${prediction.sentiment_yes} NO=${prediction.sentiment_no}`);

    let predictionStakes = 0;

    // Each bot decides whether to participate
    for (const bot of botUsers) {
      stats.total++;

      // Check if bot participates
      if (!shouldParticipate()) {
        stats.skipped++;
        continue;
      }

      const position = getPosition(prediction);
      const stakeAmount = getStakeAmount(bot.personality!);

      const result = await placeStake(bot.id, prediction.id, position, stakeAmount);

      if (result.success) {
        stats.successful++;
        predictionStakes++;
        if (position === "YES") stats.yesCount++;
        else stats.noCount++;
        stats.totalCredits += stakeAmount;
        
        // Track by personality
        stats.byPersonality[bot.personality!].count++;
        stats.byPersonality[bot.personality!].credits += stakeAmount;
      } else if (result.error === "Already staked") {
        stats.skipped++;
      } else {
        stats.failed++;
      }

      // Random delay between stakes
      await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    }

    console.log(`   ✅ ${predictionStakes} bots placed stakes`);
  }

  // Print summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 ADVANCED SIMULATION SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total opportunities:      ${stats.total}`);
  console.log(`✅ Successful stakes:     ${stats.successful}`);
  console.log(`⏭️  Skipped:               ${stats.skipped}`);
  console.log(`❌ Failed:                ${stats.failed}`);
  console.log("=".repeat(70));

  console.log("\n📈 POSITION DISTRIBUTION");
  console.log("=".repeat(70));
  const yesPercent = ((stats.yesCount / stats.successful) * 100).toFixed(1);
  const noPercent = ((stats.noCount / stats.successful) * 100).toFixed(1);
  console.log(`YES positions: ${stats.yesCount} (${yesPercent}%)`);
  console.log(`NO positions:  ${stats.noCount} (${noPercent}%)`);
  console.log("=".repeat(70));

  console.log("\n🎭 STAKES BY PERSONALITY");
  console.log("=".repeat(70));
  Object.entries(stats.byPersonality).forEach(([personality, data]) => {
    const avgStake = data.count > 0 ? (data.credits / data.count).toFixed(2) : "0.00";
    console.log(`${personality.padEnd(15)}: ${data.count} stakes, ${data.credits} credits (avg: ${avgStake})`);
  });
  console.log("=".repeat(70));

  console.log("\n💰 TOTAL CREDITS STAKED");
  console.log("=".repeat(70));
  console.log(`Total: ${stats.totalCredits}`);
  console.log(`Average per stake: ${(stats.totalCredits / stats.successful).toFixed(2)}`);
  console.log("=".repeat(70));

  console.log("\n✨ Advanced simulation completed!\n");
}

/**
 * Main execution
 */
async function main() {
  try {
    await runAdvancedSimulation();
  } catch (error) {
    console.error("\n❌ Error during simulation:");
    console.error(error);
    process.exit(1);
  }
}

main();
