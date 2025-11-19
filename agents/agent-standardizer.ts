// agents/agent-standardizer.ts
/**
 * Agent-2: Market-aware prediction standardizer
 * 
 * FIXES IMPLEMENTED:
 * ✅ LLM-based sentiment classification (no more keyword-only)
 * ✅ Correct reference_type for Agent-3 resolution
 * ✅ created_price for crypto predictions
 * ✅ Market-close questions only when valid
 * ✅ Holiday-aware question generation
 * ✅ Direction-resolution alignment
 * ✅ One card per raw input
 * ✅ No hallucinated numbers
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { DateTime } from "luxon";
import {
  stockExpiryDecision,
  cryptoExpiryDecision,
} from "./market-hours/index";

if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY)
  throw new Error("Missing Supabase env vars");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type Direction = "up" | "down" | "neutral";
type SentimentStrength = "strong" | "weak" | "neutral";
type ReferenceType = "open" | "previous_close" | "current";

// ---------- LLM Sentiment Classifier ----------

/**
 * Use LLM to classify sentiment from raw text
 * Replaces keyword-based detection for better accuracy
 */
async function classifySentiment(rawText: string, ticker: string): Promise<{
  direction: Direction;
  strength: SentimentStrength;
}> {
  const prompt = `You are a financial sentiment classifier. Analyze the following news text and classify the sentiment for ${ticker}.

NEWS TEXT:
"""
${rawText}
"""

TICKER: ${ticker}

Classify the sentiment:
- direction: "up" (bullish/positive), "down" (bearish/negative), or "neutral" (mixed/unclear)
- strength: "strong" (very clear sentiment), "weak" (mild sentiment), or "neutral" (ambiguous)

CRITICAL RULES:
- Never guess price targets or numbers
- Never hallucinate information
- If ambiguous, return "neutral"
- Output ONLY valid JSON

Output format:
{
  "direction": "up" | "down" | "neutral",
  "strength": "strong" | "weak" | "neutral"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 100,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      console.log("⚠️ LLM returned empty response, defaulting to neutral");
      return { direction: "neutral", strength: "neutral" };
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    
    // Validate response
    const validDirections: Direction[] = ["up", "down", "neutral"];
    const validStrengths: SentimentStrength[] = ["strong", "weak", "neutral"];
    
    const direction = validDirections.includes(parsed.direction) ? parsed.direction : "neutral";
    const strength = validStrengths.includes(parsed.strength) ? parsed.strength : "neutral";

    return { direction, strength };
  } catch (error) {
    console.error("❌ LLM sentiment classification failed:", error);
    return { direction: "neutral", strength: "neutral" };
  }
}

// ---------- Fetch Current Price for Crypto ----------

/**
 * Fetch current price from Binance for crypto predictions
 * Required for reference_type = "current"
 */
async function fetchCurrentPrice(ticker: string): Promise<number | null> {
  try {
    // Ensure ticker ends with USDT for Binance API
    const symbol = ticker.toUpperCase().endsWith("USDT") 
      ? ticker.toUpperCase() 
      : `${ticker.toUpperCase()}USDT`;

    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    
    if (!response.ok) {
      console.error(`❌ Binance API error for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const price = parseFloat(data.price);

    if (isNaN(price) || price <= 0) {
      console.error(`❌ Invalid price from Binance for ${symbol}: ${data.price}`);
      return null;
    }

    return price;
  } catch (error) {
    console.error(`❌ Failed to fetch price for ${ticker}:`, error);
    return null;
  }
}

// ---------- Question Generation ----------

/**
 * Generate prediction question based on asset type, question type, and direction
 * STRICT: No hallucinated numbers, only valid YES/NO questions
 */
function generateQuestion(
  ticker: string,
  assetType: string,
  questionType: "open" | "close" | "window",
  direction: Direction
): string {
  if (assetType === "stock") {
    if (questionType === "close") {
      // Market open, expiry at close - compare close vs open
      if (direction === "up") {
        return `Will ${ticker} close green today?`;
      } else if (direction === "down") {
        return `Will ${ticker} close red today?`;
      } else {
        return `Will ${ticker} close higher than open today?`;
      }
    } else {
      // questionType === "open"
      // Market closed or near close - compare next open vs previous close
      if (direction === "up") {
        return `Will ${ticker} open higher at next market open?`;
      } else if (direction === "down") {
        return `Will ${ticker} open lower at next market open?`;
      } else {
        return `Will ${ticker} gap up at next open?`;
      }
    }
  } else {
    // Crypto - window-based, compare expiry vs current
    if (direction === "up") {
      return `Will ${ticker} be higher at expiry?`;
    } else if (direction === "down") {
      return `Will ${ticker} be lower at expiry?`;
    } else {
      return `Will ${ticker} move up by expiry?`;
    }
  }
}

/**
 * Determine reference_type based on asset type and question type
 * CRITICAL: Agent-3 uses this for resolution
 */
function getReferenceType(
  assetType: string,
  questionType: "open" | "close" | "window"
): ReferenceType {
  if (assetType === "stock") {
    if (questionType === "close") {
      // Compare close vs open of same day
      return "open";
    } else {
      // questionType === "open"
      // Compare next open vs previous close
      return "previous_close";
    }
  } else {
    // Crypto - compare expiry vs price at creation
    return "current";
  }
}

// ---------- Core Processing ----------

async function processRow(row: {
  id: string;
  raw_text: string;
  ticker: string;
  asset_type: string;
  source_name?: string | null;
  source_url?: string | null;
}) {
  const { id, raw_text, ticker, asset_type, source_name, source_url } = row;

  console.log(`\n🔵 Processing raw id=${id} ticker=${ticker} asset_type=${asset_type}`);

  // Validate required fields (guaranteed by Agent-1)
  if (!ticker || !raw_text || !asset_type) {
    console.log(`❌ SKIPPED id=${id} - missing required fields`);
    return;
  }

  // Normalize asset_type
  const normalizedAssetType = asset_type.toLowerCase();
  if (normalizedAssetType !== "crypto" && normalizedAssetType !== "stock") {
    console.log(`❌ SKIPPED id=${id} - invalid asset_type "${asset_type}"`);
    return;
  }

  // Step 1: LLM Sentiment Classification
  console.log(`🤖 Classifying sentiment with LLM...`);
  const sentiment = await classifySentiment(raw_text, ticker);
  console.log(`📊 Sentiment: direction=${sentiment.direction} strength=${sentiment.strength}`);

  // Step 2: Compute expiry, betting_close, and question type
  type DateTimeType = ReturnType<typeof DateTime.utc>;
  let expiry: DateTimeType;
  let bettingClose: DateTimeType;
  let questionType: "open" | "close" | "window";

  const now = DateTime.utc();

  if (normalizedAssetType === "stock") {
    const decision = stockExpiryDecision(now);
    expiry = decision.expiry;
    bettingClose = decision.bettingClose;
    questionType = decision.questionType;

    console.log(`📈 Stock decision: questionType=${questionType} expiry=${expiry.toISO()} betting_close=${bettingClose.toISO()}`);
  } else {
    // Crypto
    const decision = cryptoExpiryDecision(sentiment.strength, now);
    expiry = decision.expiry;
    bettingClose = decision.bettingClose;
    questionType = "window";

    console.log(`₿ Crypto decision: window=${decision.windowHours}h expiry=${expiry.toISO()} betting_close=${bettingClose.toISO()}`);
  }

  // Step 3: Safety check - betting_close must be in future
  if (bettingClose <= now) {
    console.log(`❌ SKIPPED id=${id} - betting_close ${bettingClose.toISO()} is in the past`);
    return;
  }

  // Step 4: Determine reference_type for Agent-3
  const referenceType = getReferenceType(normalizedAssetType, questionType);
  console.log(`🎯 Reference type: ${referenceType}`);

  // Step 5: Fetch created_price for crypto predictions
  let createdPrice: number | null = null;
  if (normalizedAssetType === "crypto" && referenceType === "current") {
    createdPrice = await fetchCurrentPrice(ticker);
    if (createdPrice === null) {
      console.log(`❌ SKIPPED id=${id} - failed to fetch current price for crypto`);
      return;
    }
    console.log(`💰 Created price: ${createdPrice}`);
  }

  // Step 6: Generate prediction question
  const predictionText = generateQuestion(ticker, normalizedAssetType, questionType, sentiment.direction);
  console.log(`📝 Generated question: "${predictionText}"`);

  // Step 7: Insert prediction into database
  try {
    const insertData: any = {
      prediction_text: predictionText,
      source_name: source_name || null,
      source_category: "Analyst",
      asset: ticker,
      asset_type: normalizedAssetType,
      direction: sentiment.direction,
      reference_type: referenceType,
      raw_text: raw_text,
      expiry_timestamp: expiry.toISO(),
      betting_close: bettingClose.toISO(),
      sentiment_yes: 0,
      sentiment_no: 0,
      status: "pending",
      prediction_hash: null,
      resolution_report: null,
    };

    // Add created_price for crypto
    if (createdPrice !== null) {
      insertData.created_price = createdPrice;
    }

    const { data: insertedPrediction, error: insertError } = await supabase
      .from("predictions")
      .insert(insertData)
      .select("id")
      .single();

    if (insertError) {
      console.error(`❌ Failed to insert prediction for id=${id}:`, insertError);
      return;
    }

    console.log(`✅ INSERTED predictionId=${insertedPrediction.id} ticker=${ticker} direction=${sentiment.direction} reference_type=${referenceType}`);

    // Step 8: Mark ai_raw_inputs row as processed
    const { error: updateError } = await supabase
      .from("ai_raw_inputs")
      .update({ processed: true })
      .eq("id", id);

    if (updateError) {
      console.error(`⚠️ Failed to mark raw row processed id=${id}:`, updateError);
    } else {
      console.log(`✅ Marked raw id=${id} as processed`);
    }
  } catch (err) {
    console.error(`❌ Exception processing id=${id}:`, err);
  }
}

// ---------- Public Runner ----------

export async function runAgent2ForIds(ids?: string[]) {
  console.log("🔵 Agent-2 started at", new Date().toISOString());
  console.log("\n🚀 Agent-2 start. ids?", ids?.length ?? "none");

  let rows: any[] = [];

  if (Array.isArray(ids) && ids.length > 0) {
    const { data, error } = await supabase
      .from("ai_raw_inputs")
      .select("*")
      .in("id", ids);

    if (error) {
      console.error("❌ Failed to fetch ai_raw_inputs by ids", error);
      return;
    }
    rows = data || [];
  } else {
    // Fallback: process unprocessed rows
    const { data, error } = await supabase
      .from("ai_raw_inputs")
      .select("*")
      .eq("processed", false)
      .limit(20);

    if (error) {
      console.error("❌ Failed to fetch ai_raw_inputs", error);
      return;
    }
    rows = data || [];
  }

  if (!rows.length) {
    console.log("ℹ️ Nothing to process in Agent-2.");
    return;
  }

  console.log(`📋 Processing ${rows.length} rows...`);

  for (const row of rows) {
    try {
      await processRow(row);
    } catch (err) {
      console.error(`❌ Error processing row id=${row.id}:`, err);
    }
  }

  console.log("\n✅ Agent-2 done.");
  console.log("🔵 Agent-2 finished at", new Date().toISOString());
}

