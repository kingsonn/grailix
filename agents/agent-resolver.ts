// agents/agent-resolver.ts
/**
 * Agent-3: Production-safe prediction resolver
 * 
 * FEATURES:
 * ✅ Atomic claim with status='resolving'
 * ✅ Robust price fetching (Yahoo, Binance, Coinbase)
 * ✅ reference_type-based resolution (open, previous_close, current)
 * ✅ direction-aware outcome logic
 * ✅ Structured resolution_report JSON
 * ✅ SHA-256 hashing for prediction and outcome
 * ✅ Pari-mutuel payout calculation
 * ✅ RPC-based balance updates
 * ✅ Transaction logging
 * ✅ Comprehensive error handling
 */

import "dotenv/config";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

// -------------------- Types --------------------

type PredictionRow = {
  id: number;
  prediction_text: string;
  asset: string;
  asset_type: string;
  reference_type: string;
  direction: string;
  created_price?: number | null;
  expiry_timestamp: string;
  betting_close: string;
  status: string;
  sentiment_yes: number;
  sentiment_no: number;
  prediction_hash?: string | null;
  outcome_hash?: string | null;
  outcome_value?: string | null;
  resolved_price?: number | null;
  resolved_timestamp?: string | null;
  resolution_report?: any;
  raw_text?: string;
  source_name?: string;
};

type PriceSources = {
  yahoo?: number | null;
  binance?: number | null;
  coinbase?: number | null;
  coingecko?: number | null;
  bybit?: number | null;
  mexc?: number | null;
  dexscreener?: number | null;
};

type PriceData = {
  final_price: number;
  open_price?: number | null;
  previous_close?: number | null;
  sources: PriceSources;
};

type ResolutionReport = {
  prediction_id: number;
  asset: string;
  asset_type: string;
  reference_type: string;
  direction: string;
  created_price?: number | null;
  final_price: number;
  final_price_sources: PriceSources;
  open_price?: number | null;
  previous_close?: number | null;
  pct_change?: number | null;
  variance_pct?: number | null;
  confidence: string;
  resolution_rule: string;
  resolved_at: string;
  notes: string[];
};

// -------------------- Config --------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase env vars");
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PLATFORM_FEE = 0.05; // 5% platform fee
const DECIMAL_PRECISION = 6; // 6 decimal places for payouts

// Vault contract configuration
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;

// Ensure private key has 0x prefix
const rawPrivateKey = process.env.VAULT_PRIVATE_KEY;
const VAULT_PRIVATE_KEY = rawPrivateKey 
  ? (rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`) as `0x${string}`
  : undefined;

const GrailixVault_ABI = [
  {
    inputs: [
      { name: "predictionId", type: "uint256" },
      { name: "outcomeHash", type: "bytes32" },
    ],
    name: "storeOutcomeHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// -------------------- Price Fetchers --------------------

/**
 * Fetch stock prices from Yahoo Finance
 */
async function fetchYahooPrice(symbol: string): Promise<{
  final_price?: number;
  open_price?: number;
  previous_close?: number;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?region=US&lang=en-US&interval=1m`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Yahoo API error for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      console.error(`❌ No chart result from Yahoo for ${symbol}`);
      return null;
    }

    const meta = result.meta;
    const final_price = meta?.regularMarketPrice;
    const open_price = getOpeningPrice(result);
    const previous_close = meta?.previousClose || meta?.chartPreviousClose;

    return {
      final_price: final_price ? Number(final_price) : undefined,
      open_price: open_price ? Number(open_price) : undefined,
      previous_close: previous_close ? Number(previous_close) : undefined,
    };
  } catch (error) {
    console.error(`❌ Yahoo fetch failed for ${symbol}:`, error);
    return null;
  }
}

//get opening price from yahoo
function getOpeningPrice(data: any): number | undefined {
  // If meta.regularMarketOpen is defined, use it directly
  if (data.meta.regularMarketOpen !== undefined) {
    return data.meta.regularMarketOpen;
  }

  // Otherwise, fall back to the first open value at the start of the regular session
  const regularStart = data.meta.currentTradingPeriod.regular.start;
  const idx = data.timestamp.indexOf(regularStart);

  if (idx !== -1) {
    const openArray = data.indicators.quote[0].open;
    return openArray[idx] ?? undefined;
  }

  return undefined;
}

/**
 * Fetch crypto price from Binance 1-minute candle at specific timestamp
 * Returns the opening price of the candle
 */
async function fetchBinanceCandlePrice(symbol: string, timestamp: number): Promise<number | null> {
  try {
    const binanceSymbol = symbol.toUpperCase().endsWith("USDT")
      ? symbol.toUpperCase()
      : `${symbol.toUpperCase()}USDT`;

    // Binance klines API: timestamp should be in milliseconds
    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1m&startTime=${timestamp}&limit=1`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Binance candle API error for ${binanceSymbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      console.error(`❌ No Binance candle data for ${binanceSymbol} at ${timestamp}`);
      return null;
    }

    // Binance kline format: [openTime, open, high, low, close, volume, ...]
    const openPrice = parseFloat(data[0][1]);

    if (isNaN(openPrice) || openPrice <= 0) {
      console.error(`❌ Invalid Binance candle price for ${binanceSymbol}`);
      return null;
    }

    console.log(`✅ Binance candle price for ${binanceSymbol} at ${new Date(timestamp).toISOString()}: ${openPrice}`);
    return openPrice;
  } catch (error) {
    console.error(`❌ Binance candle fetch failed for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch crypto price from Bybit 1-minute candle at specific timestamp
 * Returns the opening price of the candle
 */
async function fetchBybitCandlePrice(symbol: string, timestamp: number): Promise<number | null> {
  try {
    const bybitSymbol = symbol.toUpperCase().endsWith("USDT")
      ? symbol.toUpperCase()
      : `${symbol.toUpperCase()}USDT`;

    // Bybit kline API: timestamp in milliseconds
    const url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${bybitSymbol}&interval=1&start=${timestamp}&limit=1`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Bybit candle API error for ${bybitSymbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const candles = data?.result?.list;
    
    if (!candles || candles.length === 0) {
      console.error(`❌ No Bybit candle data for ${bybitSymbol} at ${timestamp}`);
      return null;
    }

    // Bybit kline format: [startTime, open, high, low, close, volume, turnover]
    const openPrice = parseFloat(candles[0][1]);

    if (isNaN(openPrice) || openPrice <= 0) {
      console.error(`❌ Invalid Bybit candle price for ${bybitSymbol}`);
      return null;
    }

    console.log(`✅ Bybit candle price for ${bybitSymbol} at ${new Date(timestamp).toISOString()}: ${openPrice}`);
    return openPrice;
  } catch (error) {
    console.error(`❌ Bybit candle fetch failed for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch crypto price from MEXC 1-minute candle at specific timestamp
 * Returns the opening price of the candle
 */
async function fetchMEXCCandlePrice(symbol: string, timestamp: number): Promise<number | null> {
  try {
    const mexcSymbol = symbol.toUpperCase().endsWith("USDT")
      ? symbol.toUpperCase()
      : `${symbol.toUpperCase()}USDT`;

    // MEXC klines API: timestamp in milliseconds
    const url = `https://api.mexc.com/api/v3/klines?symbol=${mexcSymbol}&interval=1m&startTime=${timestamp}&limit=1`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ MEXC candle API error for ${mexcSymbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      console.error(`❌ No MEXC candle data for ${mexcSymbol} at ${timestamp}`);
      return null;
    }

    // MEXC kline format: [openTime, open, high, low, close, volume, ...]
    const openPrice = parseFloat(data[0][1]);

    if (isNaN(openPrice) || openPrice <= 0) {
      console.error(`❌ Invalid MEXC candle price for ${mexcSymbol}`);
      return null;
    }

    console.log(`✅ MEXC candle price for ${mexcSymbol} at ${new Date(timestamp).toISOString()}: ${openPrice}`);
    return openPrice;
  } catch (error) {
    console.error(`❌ MEXC candle fetch failed for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch crypto price from DEX Screener candles at specific timestamp
 * First searches for the token, then tries to fetch candles
 * Falls back to current price if candles are unavailable
 */
async function fetchDEXScreenerCandlePrice(symbol: string, timestamp: number): Promise<number | null> {
  try {
    const baseSymbol = symbol.toUpperCase().replace("USDT", "");
    
    // Step 1: Search for the token
    const searchUrl = `https://api.dexscreener.com/latest/dex/search?q=${baseSymbol}`;
    console.log(`🔍 Searching DEX Screener for ${baseSymbol}...`);
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      console.error(`❌ DEX Screener search error for ${baseSymbol}: ${searchResponse.status}`);
      return null;
    }

    const searchData = await searchResponse.json();
    const pairs = searchData?.pairs;

    if (!pairs || pairs.length === 0) {
      console.error(`❌ No pairs found on DEX Screener for ${baseSymbol}`);
      return null;
    }

    // Step 2: Find pair with highest liquidity
    let highestLiquidityPair = pairs[0];
    let maxLiquidity = parseFloat(highestLiquidityPair?.liquidity?.usd || "0");

    for (const pair of pairs) {
      const liquidity = parseFloat(pair?.liquidity?.usd || "0");
      if (liquidity > maxLiquidity) {
        maxLiquidity = liquidity;
        highestLiquidityPair = pair;
      }
    }

    const chainId = highestLiquidityPair.chainId;
    const pairAddress = highestLiquidityPair.pairAddress;
    console.log(`📊 Found pair on ${chainId}: ${pairAddress} (liquidity: $${maxLiquidity.toFixed(2)})`);

    // Step 3: Try to fetch candles for the pair
    const unixTimestamp = Math.floor(timestamp / 1000);
    const candleUrl = `https://api.dexscreener.com/latest/dex/candles/${chainId}/${pairAddress}?interval=1m&from=${unixTimestamp}&to=${unixTimestamp + 60}`;
    console.log(`🕯️ Fetching candles from: ${candleUrl}`);
    
    const candleResponse = await fetch(candleUrl);

    if (!candleResponse.ok) {
      console.warn(`⚠️ DEX Screener candle API error (${candleResponse.status}), falling back to current price`);
      
      // Fallback: Use current price from search result
      const currentPrice = parseFloat(highestLiquidityPair?.priceUsd);
      if (isNaN(currentPrice) || currentPrice <= 0) {
        console.error(`❌ Invalid current price from DEX Screener for ${baseSymbol}`);
        return null;
      }
      
      console.log(`✅ DEX Screener current price for ${baseSymbol}: ${currentPrice} (chain: ${chainId}, liquidity: $${maxLiquidity.toFixed(2)})`);
      return currentPrice;
    }

    const candleData = await candleResponse.json();
    const candles = candleData?.candles;

    if (!candles || candles.length === 0) {
      console.warn(`⚠️ No DEX Screener candle data at timestamp, using current price`);
      
      // Fallback: Use current price from search result
      const currentPrice = parseFloat(highestLiquidityPair?.priceUsd);
      if (isNaN(currentPrice) || currentPrice <= 0) {
        console.error(`❌ Invalid current price from DEX Screener for ${baseSymbol}`);
        return null;
      }
      
      console.log(`✅ DEX Screener current price for ${baseSymbol}: ${currentPrice} (chain: ${chainId}, liquidity: $${maxLiquidity.toFixed(2)})`);
      return currentPrice;
    }

    // DEX Screener candle format: {timestamp, open, high, low, close, volume}
    const openPrice = parseFloat(candles[0].open);

    if (isNaN(openPrice) || openPrice <= 0) {
      console.error(`❌ Invalid DEX Screener candle price for ${baseSymbol}`);
      return null;
    }

    console.log(`✅ DEX Screener candle price for ${baseSymbol} at ${new Date(timestamp).toISOString()}: ${openPrice} (chain: ${chainId}, liquidity: $${maxLiquidity.toFixed(2)})`);
    return openPrice;
  } catch (error) {
    console.error(`❌ DEX Screener candle fetch failed for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch all relevant prices for a prediction
 * For crypto: fetches 1-minute OHLC candle at expiry_timestamp
 * For stocks: fetches current/historical prices from Yahoo
 */
async function fetchPrices(
  asset: string,
  assetType: string,
  expiryTimestamp?: string
): Promise<PriceData | null> {
  const sources: PriceSources = {};
  let final_price: number | undefined;
  let open_price: number | undefined;
  let previous_close: number | undefined;

  if (assetType === "stock") {
    // Fetch from Yahoo
    const yahooData = await fetchYahooPrice(asset);
    if (yahooData) {
      sources.yahoo = yahooData.final_price;
      final_price = yahooData.final_price;
      open_price = yahooData.open_price;
      previous_close = yahooData.previous_close;
    }
  } else if (assetType === "crypto") {
    // Convert expiry timestamp to milliseconds
    if (!expiryTimestamp) {
      console.error(`❌ No expiry timestamp provided for crypto ${asset}`);
      return null;
    }

    const timestampMs = new Date(expiryTimestamp).getTime();
    console.log(`🕒 Fetching candle for ${asset} at ${expiryTimestamp} (${timestampMs}ms)`);

    // Try Binance first, fallback to Bybit, MEXC, then DEX Screener
    const binancePrice = await fetchBinanceCandlePrice(asset, timestampMs);
    if (binancePrice) {
      sources.binance = binancePrice;
      final_price = binancePrice;
    } else {
      console.log(`⚠️ Binance failed for ${asset}, trying Bybit...`);
      const bybitPrice = await fetchBybitCandlePrice(asset, timestampMs);
      if (bybitPrice) {
        sources.bybit = bybitPrice;
        final_price = bybitPrice;
      } else {
        console.log(`⚠️ Bybit failed for ${asset}, trying MEXC...`);
        const mexcPrice = await fetchMEXCCandlePrice(asset, timestampMs);
        if (mexcPrice) {
          sources.mexc = mexcPrice;
          final_price = mexcPrice;
        } else {
          console.log(`⚠️ MEXC failed for ${asset}, trying DEX Screener...`);
          const dexPrice = await fetchDEXScreenerCandlePrice(asset, timestampMs);
          if (dexPrice) {
            sources.dexscreener = dexPrice;
            final_price = dexPrice;
          }
        }
      }
    }
  }

  if (!final_price) {
    console.error(`❌ No final price available for ${asset} (${assetType})`);
    return null;
  }

  return {
    final_price,
    open_price,
    previous_close,
    sources,
  };
}

// -------------------- Hashing --------------------

/**
 * Canonicalize JSON for consistent hashing
 */
function canonicalizeJSON(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * Compute SHA-256 hash
 */
function sha256(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Compute prediction_hash and outcome_hash
 */
function computeHashes(
  prediction: PredictionRow,
  resolutionReport: ResolutionReport
): { predictionHash: string; outcomeHash: string } {
  const predictionData = {
    prediction_id: prediction.id,
    prediction_text: prediction.prediction_text,
    asset: prediction.asset,
    reference_type: prediction.reference_type,
    direction: prediction.direction,
    created_price: prediction.created_price,
    expiry_timestamp: prediction.expiry_timestamp,
    betting_close: prediction.betting_close,
  };

  const predictionHash = sha256(canonicalizeJSON(predictionData));
  const outcomeHash = sha256(canonicalizeJSON(resolutionReport));

  return { predictionHash, outcomeHash };
}

// -------------------- Outcome Computation --------------------

/**
 * Compute outcome based on reference_type and direction
 */
function computeOutcome(
  prediction: PredictionRow,
  priceData: PriceData
): { outcome: "YES" | "NO"; report: ResolutionReport } {
  const {
    id,
    asset,
    asset_type,
    reference_type,
    direction,
    created_price,
  } = prediction;

  const { final_price, open_price, previous_close, sources } = priceData;

  const notes: string[] = [];
  let baseline: number | undefined;
  let pct_change: number | undefined;
  let resolution_rule: string;
  let outcome: "YES" | "NO";

  // Determine baseline and outcome based on reference_type
  if (reference_type === "open") {
    // Stock close-type: compare close vs today's open
    resolution_rule = "Stock close vs open";
    baseline = open_price ?? undefined;

    if (!baseline) {
      throw new Error(`Missing open_price for reference_type='open'`);
    }

    pct_change = ((final_price - baseline) / baseline) * 100;

    if (direction === "up" || direction === "neutral") {
      outcome = pct_change > 0 ? "YES" : "NO";
    } else {
      // direction === "down"
      outcome = pct_change < 0 ? "YES" : "NO";
    }

    notes.push(`Compared close ${final_price} vs open ${baseline}`);
  } else if (reference_type === "previous_close") {
    // Stock open-type: compare next open vs previous close
    resolution_rule = "Stock open vs previous close";
    baseline = previous_close ?? undefined;

    if (!baseline) {
      throw new Error(`Missing previous_close for reference_type='previous_close'`);
    }

    pct_change = ((final_price - baseline) / baseline) * 100;

    if (direction === "up" || direction === "neutral") {
      outcome = pct_change > 0 ? "YES" : "NO";
    } else {
      // direction === "down"
      outcome = pct_change < 0 ? "YES" : "NO";
    }

    notes.push(`Compared open ${final_price} vs previous close ${baseline}`);
  } else if (reference_type === "current") {
    // Crypto: compare expiry vs created price
    resolution_rule = "Crypto expiry vs created price";
    baseline = created_price ?? undefined;

    if (!baseline) {
      throw new Error(`Missing created_price for reference_type='current'`);
    }

    pct_change = ((final_price - baseline) / baseline) * 100;

    if (direction === "up" || direction === "neutral") {
      outcome = final_price > baseline ? "YES" : "NO";
    } else {
      // direction === "down"
      outcome = final_price < baseline ? "YES" : "NO";
    }

    notes.push(`Compared expiry ${final_price} vs created ${baseline}`);
  } else {
    throw new Error(`Unknown reference_type: ${reference_type}`);
  }

  // Build resolution report
  const report: ResolutionReport = {
    prediction_id: id,
    asset,
    asset_type,
    reference_type,
    direction,
    created_price: created_price ?? null,
    final_price,
    final_price_sources: sources,
    open_price: open_price ?? null,
    previous_close: previous_close ?? null,
    pct_change: pct_change ?? null,
    variance_pct: null, // Can be calculated if multiple sources
    confidence: "high",
    resolution_rule,
    resolved_at: new Date().toISOString(),
    notes,
  };

  return { outcome, report };
}

// -------------------- Payout Calculation --------------------

/**
 * Apply pari-mutuel payouts to winners
 */
async function applyPayouts(
  predictionId: number,
  outcome: "YES" | "NO",
  predictionText: string
): Promise<void> {
  console.log(`💰 Calculating payouts for prediction ${predictionId}, outcome=${outcome}`);

  // Fetch all stakes for this prediction
  const { data: stakes, error: stakesError } = await supabase
    .from("user_prediction_stakes")
    .select("*")
    .eq("prediction_id", predictionId);

  if (stakesError || !stakes) {
    console.error(`❌ Failed to fetch stakes for prediction ${predictionId}:`, stakesError);
    return;
  }

  if (stakes.length === 0) {
    console.log(`ℹ️ No stakes for prediction ${predictionId}`);
    return;
  }

  // Calculate pools
  const totalYes = stakes
    .filter((s) => s.position === "YES")
    .reduce((sum, s) => sum + s.stake_credits, 0);

  const totalNo = stakes
    .filter((s) => s.position === "NO")
    .reduce((sum, s) => sum + s.stake_credits, 0);

  const winningPool = outcome === "YES" ? totalYes : totalNo;
  const losingPool = outcome === "YES" ? totalNo : totalYes;

  console.log(`📊 Pools: YES=${totalYes}, NO=${totalNo}, Winning=${winningPool}, Losing=${losingPool}`);

  if (winningPool === 0) {
    console.log(`ℹ️ No winners for prediction ${predictionId}, notifying losers only`);
    
    // Create loss notifications for all stakers (since everyone lost)
    for (const loser of stakes) {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: loser.user_id,
        prediction_id: predictionId,
        type: "loss",
        title: "📉 Prediction Lost",
        message: `Your prediction "${predictionText}" resolved as ${outcome}. Better luck next time!`,
        payout_amount: 0,
        read: false,
      });

      if (notifError) {
        console.error(`❌ Failed to create loss notification for user ${loser.user_id}:`, notifError);
      }
    }
    
    console.log(`✅ Loss notifications sent for prediction ${predictionId}`);
    return;
  }

  // Calculate payouts with decimal precision
  const fee = parseFloat((losingPool * PLATFORM_FEE).toFixed(DECIMAL_PRECISION));
  const distributable = parseFloat((losingPool - fee).toFixed(DECIMAL_PRECISION));

  console.log(`💸 Fee=${fee}, Distributable=${distributable}`);

  const winners = stakes.filter((s) => s.position === outcome);
  
  // Calculate all payouts first to ensure total doesn't exceed distributable
  const payoutCalculations: Array<{ winner: any; stake: number; payout: number }> = [];
  let totalPayouts = 0;

  for (const winner of winners) {
    const stake = winner.stake_credits;
    let payout: number;
    
    if (losingPool === 0) {
      // No opposite liquidity - return stake only
      payout = stake;
    } else {
      // Pari-mutuel formula with decimal precision
      const share = stake / winningPool;
      const rawPayout = stake + share * distributable;
      // Floor to 6 decimals
      payout = Math.floor(rawPayout * Math.pow(10, DECIMAL_PRECISION)) / Math.pow(10, DECIMAL_PRECISION);
    }
    
    payoutCalculations.push({ winner, stake, payout });
    totalPayouts += payout;
  }
  
  // Verify total payouts don't exceed distributable + winning pool
  const maxAllowable = winningPool + distributable;
  if (totalPayouts > maxAllowable) {
    console.warn(`⚠️ Total payouts (${totalPayouts}) exceed allowable (${maxAllowable}). Adjusting...`);
    // Scale down proportionally
    const scaleFactor = maxAllowable / totalPayouts;
    payoutCalculations.forEach(calc => {
      calc.payout = Math.floor(calc.payout * scaleFactor * Math.pow(10, DECIMAL_PRECISION)) / Math.pow(10, DECIMAL_PRECISION);
    });
  }

  // Apply payouts
  for (const { winner, stake, payout } of payoutCalculations) {
    console.log(`  → User ${winner.user_id}: stake=${stake}, payout=${payout}`);

    // Update user_stakes with payout
    const { error: updateStakeError } = await supabase
      .from("user_prediction_stakes")
      .update({ payout_credits: payout })
      .eq("id", winner.id);

    if (updateStakeError) {
      console.error(`❌ Failed to update stake ${winner.id}:`, updateStakeError);
      continue;
    }

    // Increment user balance via RPC with decimal amount (retry up to 3 times)
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error: rpcError } = await supabase.rpc("increment_user_balance", {
        user_id_input: winner.user_id,
        amount: payout, // Now accepts numeric/decimal
      });

      if (!rpcError) {
        success = true;
        break;
      }

      console.error(`❌ RPC attempt ${attempt} failed for user ${winner.wallet_address}:`, rpcError);
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }

    if (!success) {
      console.error(`❌ Failed to increment balance for user ${winner.wallet_address} after 3 attempts`);
      continue;
    }

    // Log transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: winner.user_id,
      type: "payout",
      amount: payout,
      status: "confirmed",
    });

    if (txError) {
      console.error(`❌ Failed to log transaction for user ${winner.user_id}:`, txError);
    }

    // Create win notification
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: winner.user_id,
      prediction_id: predictionId,
      type: "win",
      title: "🎉 Prediction Won!",
      message: `You won ${payout.toFixed(2)} credits on "${predictionText}"`,
      payout_amount: payout,
      read: false,
    });

    if (notifError) {
      console.error(`❌ Failed to create win notification for user ${winner.user_id}:`, notifError);
    }
  }

  // Create loss notifications for losing side
  const losingStakes = stakes.filter((s) => s.position !== outcome);
  for (const loser of losingStakes) {
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: loser.user_id,
      prediction_id: predictionId,
      type: "loss",
      title: "📉 Prediction Lost",
      message: `Your prediction "${predictionText}" resolved as ${outcome}. Better luck next time!`,
      payout_amount: 0,
      read: false,
    });

    if (notifError) {
      console.error(`❌ Failed to create loss notification for user ${loser.user_id}:`, notifError);
    }
  }

  console.log(`✅ Payouts applied for prediction ${predictionId}`);
}

// -------------------- Main Resolution --------------------

/**
 * Resolve a single prediction
 */
async function resolvePrediction(prediction: PredictionRow): Promise<void> {
  const { id, asset, asset_type, reference_type, direction } = prediction;

  console.log(`\n🔍 Resolving prediction ${id}: ${asset} (${asset_type}, ${reference_type}, ${direction})`);

  try {
    // Step 1: Fetch prices
    console.log(`📡 Fetching prices for ${asset}...`);
    const priceData = await fetchPrices(asset, asset_type, prediction.expiry_timestamp);

    if (!priceData) {
      console.error(`❌ No price data available for ${asset} - reverting to pending`);
      await supabase
        .from("predictions")
        .update({ status: "pending" })
        .eq("id", id);
      return;
    }

    console.log(`✅ Prices fetched: final=${priceData.final_price}, open=${priceData.open_price}, prev_close=${priceData.previous_close}`);

    // Step 2: Compute outcome
    console.log(`🧮 Computing outcome...`);
    const { outcome, report } = computeOutcome(prediction, priceData);
    console.log(`✅ Outcome: ${outcome}`);

    // Step 3: Compute hashes
    const { predictionHash, outcomeHash } = computeHashes(prediction, report);
    console.log(`🔐 Computed hashes - Prediction: ${predictionHash.slice(0, 10)}..., Outcome: ${outcomeHash.slice(0, 10)}...`);

    // Step 4: Store outcome hash on blockchain
    let outcomeTxHash: string | null = null;
    try {
      console.log(`📝 Storing outcome hash on blockchain for prediction ${id}...`);
      
      if (!VAULT_PRIVATE_KEY || !VAULT_ADDRESS) {
        throw new Error("Vault private key or address not configured");
      }

      const account = privateKeyToAccount(VAULT_PRIVATE_KEY);
      const walletClient = createWalletClient({
        account,
        chain: bscTestnet,
        transport: http(),
      });

      const hash = await walletClient.writeContract({
        address: VAULT_ADDRESS,
        abi: GrailixVault_ABI,
        functionName: "storeOutcomeHash",
        args: [BigInt(id), `0x${outcomeHash}` as `0x${string}`],
      });

      outcomeTxHash = hash;
      console.log(`✅ Outcome hash stored on blockchain. Tx: ${hash}`);
    } catch (error) {
      console.error(`❌ Failed to store outcome hash on blockchain:`, error);
      // Continue with resolution even if blockchain storage fails
    }

    // Step 5: Apply payouts
    await applyPayouts(id, outcome, prediction.prediction_text);

    // Step 6: Update prediction status
    const { error: updateError } = await supabase
      .from("predictions")
      .update({
        status: "resolved",
        outcome_value: outcome,
        resolved_price: report.final_price,
        resolved_timestamp: new Date().toISOString(),
        resolution_report: report,
        // prediction_hash is preserved (set by agent-standardizer)
        outcome_hash: outcomeTxHash, // Store blockchain tx hash instead of hash itself
      })
      .eq("id", id);

    if (updateError) {
      console.error(`❌ Failed to update prediction ${id}:`, updateError);
    }

    console.log(`✅ Prediction ${id} resolved: outcome=${outcome}, price=${priceData.final_price}`);
  } catch (error) {
    console.error(`❌ Error resolving prediction ${id}:`, error);

    // Revert to pending on error
    await supabase
      .from("predictions")
      .update({ status: "pending" })
      .eq("id", id);
  }
}

// -------------------- Runner --------------------

/**
 * Main resolver loop
 */
export async function runResolver(): Promise<void> {
  console.log("🔵 Agent-3 started at", new Date().toISOString());
  console.log("\n🚀 Agent-3: Starting resolver...\n");

  try {
    // Step 1: Find candidates
    const { data: candidates, error: fetchError } = await supabase
      .from("predictions")
      .select("*")
      .eq("status", "pending")
      .lte("expiry_timestamp", new Date().toISOString())
      .order("expiry_timestamp", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("❌ Failed to fetch pending predictions:", fetchError);
      return;
    }

    if (!candidates || candidates.length === 0) {
      console.log("ℹ️ No pending predictions to resolve");
      return;
    }

    console.log(`📋 Found ${candidates.length} predictions to resolve\n`);

    // Step 2: Process each candidate
    for (const candidate of candidates) {
      // Atomic claim: update status to 'resolving'
      const { data: claimed, error: claimError } = await supabase
        .from("predictions")
        .update({ status: "resolving" })
        .eq("id", candidate.id)
        .eq("status", "pending")
        .select()
        .maybeSingle();

      if (claimError || !claimed) {
        console.log(`⚠️ Failed to claim prediction ${candidate.id} (already claimed or error) and error is ${claimError?.message}`);
        continue;
      }

      // Resolve the claimed prediction
      await resolvePrediction(claimed as PredictionRow);
    }

    console.log("\n✅ Agent-3 resolver complete\n");
  } catch (error) {
    console.error("❌ Agent-3 error:", error);
  }
  console.log("🔵 Agent-3 finished at", new Date().toISOString());
}
runResolver();
