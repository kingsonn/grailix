// agents/test/test-agent2.ts
/**
 * Test script for Agent-2 market-aware standardizer
 * 
 * Usage:
 *   npx tsx agents/test/test-agent2.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { runAgent2ForIds } from "../agent-standardizer";
import { DateTime } from "luxon";
import { isMarketOpen, stockExpiryDecision, cryptoExpiryDecision } from "../market-hours/index";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Test data samples
const TEST_SAMPLES = [
  {
    raw_text: "Apple stock surges on strong earnings beat, analysts upgrade to buy",
    ticker: "AAPL",
    asset_type: "stock",
    source_name: "Bloomberg",
    source_url: "https://example.com/aapl",
  },
  {
    raw_text: "Tesla plunges after disappointing delivery numbers, bearish outlook",
    ticker: "TSLA",
    asset_type: "stock",
    source_name: "Reuters",
    source_url: "https://example.com/tsla",
  },
  {
    raw_text: "Bitcoin rally continues as institutional investors increase holdings",
    ticker: "BTCUSDT",
    asset_type: "crypto",
    source_name: "CoinDesk",
    source_url: "https://example.com/btc",
  },
  {
    raw_text: "Ethereum drops sharply amid regulatory concerns and market weakness",
    ticker: "ETHUSDT",
    asset_type: "crypto",
    source_name: "CoinTelegraph",
    source_url: "https://example.com/eth",
  },
];

async function testMarketHours() {
  console.log("\n=== Testing Market Hours Utilities ===\n");

  const now = DateTime.now().setZone("America/New_York");
  console.log(`Current time (ET): ${now.toFormat("yyyy-MM-dd HH:mm:ss")}`);
  console.log(`Market open: ${isMarketOpen(now)}`);

  const stockDecision = stockExpiryDecision(now);
  console.log(`\nStock expiry decision:`);
  console.log(`  Question type: ${stockDecision.questionType}`);
  console.log(`  Expiry: ${stockDecision.expiry.toISO()}`);
  console.log(`  Betting close: ${stockDecision.bettingClose.toISO()}`);

  const cryptoStrong = cryptoExpiryDecision("strong", DateTime.utc());
  console.log(`\nCrypto (strong sentiment):`);
  console.log(`  Window: ${cryptoStrong.windowHours}h`);
  console.log(`  Expiry: ${cryptoStrong.expiry.toISO()}`);
  console.log(`  Betting close: ${cryptoStrong.bettingClose.toISO()}`);

  const cryptoWeak = cryptoExpiryDecision("weak", DateTime.utc());
  console.log(`\nCrypto (weak sentiment):`);
  console.log(`  Window: ${cryptoWeak.windowHours}h`);
  console.log(`  Expiry: ${cryptoWeak.expiry.toISO()}`);
  console.log(`  Betting close: ${cryptoWeak.bettingClose.toISO()}`);
}

async function insertTestData() {
  console.log("\n=== Inserting Test Data ===\n");

  const insertedIds: string[] = [];

  for (const sample of TEST_SAMPLES) {
    try {
      const { data, error } = await supabase
        .from("ai_raw_inputs")
        .insert({
          raw_text: sample.raw_text,
          ticker: sample.ticker,
          asset_type: sample.asset_type,
          source_name: sample.source_name,
          source_url: sample.source_url,
          processed: false,
        })
        .select("id")
        .single();

      if (error) {
        console.error(`❌ Failed to insert ${sample.ticker}:`, error);
      } else if (data) {
        insertedIds.push(data.id);
        console.log(`✅ Inserted ${sample.ticker} (id: ${data.id})`);
      }
    } catch (err) {
      console.error(`❌ Exception inserting ${sample.ticker}:`, err);
    }
  }

  return insertedIds;
}

async function verifyPredictions(rawIds: string[]) {
  console.log("\n=== Verifying Generated Predictions ===\n");

  // Wait a moment for processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check if raw inputs were marked processed
  const { data: rawInputs, error: rawError } = await supabase
    .from("ai_raw_inputs")
    .select("*")
    .in("id", rawIds);

  if (rawError) {
    console.error("❌ Failed to fetch raw inputs:", rawError);
    return;
  }

  console.log("\nRaw Inputs Status:");
  rawInputs?.forEach((row) => {
    console.log(`  ${row.ticker}: processed=${row.processed}`);
  });

  // Fetch generated predictions
  const { data: predictions, error: predError } = await supabase
    .from("predictions")
    .select("*")
    .order("created_timestamp", { ascending: false })
    .limit(10);

  if (predError) {
    console.error("❌ Failed to fetch predictions:", predError);
    return;
  }

  console.log("\nGenerated Predictions:");
  predictions?.forEach((pred) => {
    console.log(`\n  Prediction ID: ${pred.id}`);
    console.log(`  Asset: ${pred.asset} (${pred.asset_type})`);
    console.log(`  Direction: ${pred.direction}`);
    console.log(`  Question: ${pred.prediction_text}`);
    console.log(`  Expiry: ${pred.expiry_timestamp}`);
    console.log(`  Betting Close: ${pred.betting_close}`);
    
    // Verify betting_close is before expiry
    const expiry = new Date(pred.expiry_timestamp).getTime();
    const bettingClose = new Date(pred.betting_close).getTime();
    const diff = expiry - bettingClose;
    console.log(`  Betting window: ${Math.floor(diff / 60000)} minutes`);
    
    if (bettingClose >= expiry) {
      console.log(`  ⚠️ WARNING: betting_close >= expiry!`);
    }
    if (bettingClose <= Date.now()) {
      console.log(`  ⚠️ WARNING: betting_close in the past!`);
    }
  });
}

async function cleanupTestData(rawIds: string[]) {
  console.log("\n=== Cleanup (Optional) ===\n");
  console.log("To clean up test data, run:");
  console.log(`DELETE FROM ai_raw_inputs WHERE id IN ('${rawIds.join("', '")}');`);
  console.log(`DELETE FROM predictions WHERE asset IN ('AAPL', 'TSLA', 'BTCUSDT', 'ETHUSDT') AND created_timestamp > NOW() - INTERVAL '1 hour';`);
}

async function main() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║   Agent-2 Market-Aware Standardizer Test  ║");
  console.log("╚════════════════════════════════════════════╝");

  try {
    // Test 1: Market hours utilities
    await testMarketHours();

    // Test 2: Insert test data
    const insertedIds = await insertTestData();

    if (insertedIds.length === 0) {
      console.log("\n❌ No test data inserted. Exiting.");
      return;
    }

    // Test 3: Run Agent-2
    console.log("\n=== Running Agent-2 ===\n");
    await runAgent2ForIds(insertedIds);

    // Test 4: Verify results
    await verifyPredictions(insertedIds);

    // Test 5: Cleanup instructions
    await cleanupTestData(insertedIds);

    console.log("\n✅ Test complete!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main().catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });
}
