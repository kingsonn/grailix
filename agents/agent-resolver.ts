// agents/agent-resolver.ts
import "dotenv/config";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type PredictionRow = {
  id: number;
  prediction_text: string;
  source_name?: string;
  source_category?: string;
  asset: string | null;
  expiry_timestamp: string;
  status: string;
  sentiment_yes: number;
  sentiment_no: number;
  prediction_hash?: string | null;
  outcome_hash?: string | null;
  outcome_value?: string | null;
  resolved_price?: number | null;
  resolved_timestamp?: string | null;
  created_timestamp?: string;
};

// -------------------- Config / env --------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Platform fee (portion of losing pool taken by platform) — configurable via env
const PLATFORM_FEE = Number(process.env.PLATFORM_FEE ?? 0.02); // 2%

// -------------------- Utility: parsing prediction_text --------------------
function parseTargetPrice(text: string): number | null {
  // match $123.45 or 123.45 or 123,456.78
  const m = text.match(/(?:\$)?\s*([0-9]{1,3}(?:[0-9,]*)(?:\.[0-9]+)?)/);
  if (!m) return null;
  const s = m[1].replace(/,/g, "");
  const n = Number(s);
  return isNaN(n) ? null : n;
}

function parsePercent(text: string): number | null {
  const m = text.match(/([+\-]?\d+(\.\d+)?)\s*%/);
  if (!m) return null;
  return Number(m[1]) / 100.0;
}

function wantsCloseHigher(text: string): boolean {
  const t = text.toLowerCase();
  return /\b(close|closing)\b.*\bhigher\b|\b(close|closing)\b.*\btoday\b.*\bhigher\b|\bwill.*close.*higher\b/.test(t);
}

function mentionsUp(text: string): boolean {
  const t = text.toLowerCase();
  return /\brise\b|\bup\b|\bhigher\b|\bincrease\b/.test(t);
}

// -------------------- Price fetchers --------------------
// Yahoo (stocks) - returns object with price/open/previousClose where available
async function fetchYahooData(symbol: string): Promise<{ price?: number; open?: number; previousClose?: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: any = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta || {};
    const price = typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : undefined;
    const open = typeof meta.regularMarketOpen === "number" ? meta.regularMarketOpen : undefined;
    const previousClose = typeof meta.chartPreviousClose === "number" ? meta.chartPreviousClose : (typeof meta.previousClose === "number" ? meta.previousClose : undefined);
    // sometimes previousClose under different keys; check common ones
    const pc =
      typeof meta.regularMarketPreviousClose === "number"
        ? meta.regularMarketPreviousClose
        : previousClose;
    return { price, open, previousClose: pc };
  } catch (err) {
    console.warn("fetchYahooData error:", (err as any)?.message ?? err);
    return null;
  }
}

// Binance (crypto)
async function fetchBinancePrice(symbol: string): Promise<number | null> {
  try {
    // symbol must be like BTCUSDT
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: any = await res.json();
    if (!json || !json.price) return null;
    return Number(json.price);
  } catch (err) {
    return null;
  }
}

// Coinbase (crypto, pair like BTC-USD)
async function fetchCoinbasePrice(pair: string): Promise<number | null> {
  try {
    const url = `https://api.coinbase.com/v2/prices/${encodeURIComponent(pair)}/spot`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: any = await res.json();
    const amt = json?.data?.amount;
    if (!amt) return null;
    return Number(amt);
  } catch (err) {
    return null;
  }
}

// -------------------- Price consensus --------------------
function median(nums: number[]) {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function getFinalPriceForAsset(asset: string): Promise<{ final: number | null; sources: Record<string, number | null>; open?: number | null; prevClose?: number | null }> {
  const sources: Record<string, number | null> = { yahoo: null, binance: null, coinbase: null };
  let open: number | null = null;
  let prevClose: number | null = null;

  // Heuristic: stocks -> pass directly to Yahoo. Crypto -> use USDT symbol for Binance & -USD for Coinbase.
  const isCrypto = !!asset.match(/USDT$|BTC$|ETH$|BNB$|SOL$|USDC$|USDT/i) || asset.includes("USDT");

  if (!isCrypto) {
    const y = await fetchYahooData(asset);
    if (y && typeof y.price === "number") {
      sources.yahoo = y.price;
    }
    if (y) {
      if (typeof y.open === "number") open = y.open;
      if (typeof y.previousClose === "number") prevClose = y.previousClose;
    }
  } else {
    // ensure Binance symbol ends with USDT
    const binSym = asset.endsWith("USDT") ? asset : asset.replace(/-USD$/i, "USDT");
    const coinPair = asset.endsWith("-USD") ? asset : asset.replace(/USDT$/i, "-USD");

    const [b, c] = await Promise.all([
      fetchBinancePrice(binSym).catch(() => null),
      fetchCoinbasePrice(coinPair).catch(() => null),
    ]);
    sources.binance = b;
    sources.coinbase = c;
    // no open/prevClose for crypto here
  }

  const vals = Object.values(sources).filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return { final: null, sources, open, prevClose };

  const final = median(vals);
  return { final, sources, open, prevClose };
}

// -------------------- Payout calculation --------------------
// Pari-mutuel: winners split losing pool proportionally. Winners get stake + share of losing pool (minus platform fee).
function computePayouts(poolYes: number, poolNo: number, stakes: Array<any>, outcome: "YES" | "NO") {
  const totalYes = Number(poolYes || 0);
  const totalNo = Number(poolNo || 0);
  const winners = stakes.filter((s) => s.position === outcome && Number(s.stake_credits) > 0);
  const winningPool = outcome === "YES" ? totalYes : totalNo;
  const losingPool = outcome === "YES" ? totalNo : totalYes;

  const results: Array<{ stakeRowId: number; user_id: string; stake: number; payout_credits: number }> = [];

  if (winners.length === 0) return results;

  if (losingPool <= 0 || winningPool <= 0) {
    // no opposite liquidity — return stake back to winners (no profits)
    winners.forEach((w) => {
      results.push({ stakeRowId: w.id, user_id: w.user_id, stake: Number(w.stake_credits), payout_credits: Number(w.stake_credits) });
    });
    return results;
  }

  const fee = Math.max(0, Math.min(0.2, PLATFORM_FEE));
  const feeAmount = losingPool * fee;
  const distributable = losingPool - feeAmount;

  winners.forEach((w) => {
    const stake = Number(w.stake_credits);
    const share = stake / winningPool;
    const gain = distributable * share;
    const payout = Math.floor(stake + gain); // integer credits
    results.push({ stakeRowId: w.id, user_id: w.user_id, stake, payout_credits: payout });
  });

  return results;
}

// -------------------- Main resolver --------------------
async function runResolver(limit = 50) {
  console.log("Agent-3 Resolver starting...");

  // fetch expired pending predictions
  const nowISO = new Date().toISOString();
  const { data: candidates, error: candErr } = await supabase
    .from("predictions")
    .select("*")
    .lte("expiry_timestamp", nowISO)
    .eq("status", "pending")
    .limit(limit);

  if (candErr) {
    console.error("Supabase fetch error:", candErr.message);
    return;
  }
  if (!candidates || candidates.length === 0) {
    console.log("No expired pending predictions found.");
    return;
  }

  console.log(`Found ${candidates.length} expired predictions.`);

  for (const pred of candidates) {
    try {
      console.log(`\n🔵 Resolving prediction ${pred.id} (${pred.asset})`);

      if (!pred.asset || typeof pred.asset !== "string") {
        console.log("❌ Prediction missing asset — skipping");
        // optionally mark as invalid/resolved with error
        continue;
      }

      // get final price (and opening/prevClose if stock)
      const { final, sources, open, prevClose } = await getFinalPriceForAsset(pred.asset);

      console.log("Price sources:", sources, "open:", open ?? null, "prevClose:", prevClose ?? null);

      if (final === null) {
        console.log("❌ No price data available for asset:", pred.asset);
        // optionally mark status as 'failed' or leave pending for retry
        continue;
      }

      // Determine outcome logic
      const text = pred.prediction_text || "";
      const target = parseTargetPrice(text);
      const percent = parsePercent(text);
      let outcome: "YES" | "NO" = "NO";

      if (target !== null) {
        outcome = final >= target ? "YES" : "NO";
      } else if (percent !== null && typeof open === "number") {
        const change = (final - open) / open;
        outcome = change >= percent ? "YES" : "NO";
      } else if (wantsCloseHigher(text) && typeof open === "number") {
        outcome = final > open ? "YES" : "NO";
      } else if (typeof prevClose === "number" && mentionsUp(text)) {
        // compare final to previous close if prediction suggests movement
        outcome = final >= prevClose ? "YES" : "NO";
      } else {
        // fallback: if text mentions up/higher, assume YES, otherwise NO (least ideal)
        outcome = mentionsUp(text) ? "YES" : "NO";
      }

      // Build resolution report
      const report = {
        prediction_id: pred.id,
        asset: pred.asset,
        prediction_text: pred.prediction_text,
        final_price: final,
        sources,
        open: open ?? null,
        prevClose: prevClose ?? null,
        resolved_at: new Date().toISOString(),
        outcome,
      };

      // compute outcome hash (sha256 hex)
      const outcomeHash = crypto.createHash("sha256").update(JSON.stringify(report)).digest("hex");

      // fetch pool & stakes
      const { data: poolData, error: poolErr } = await supabase
        .from("prediction_pools")
        .select("*")
        .eq("prediction_id", pred.id)
        .single();

      if (poolErr || !poolData) {
        console.warn("Missing pool for prediction", pred.id, poolErr?.message ?? "");
        // still update prediction resolution report & hash to preserve transparency
        await supabase
          .from("predictions")
          .update({
            status: "resolved",
            outcome_value: outcome,
            resolved_price: final,
            resolved_timestamp: new Date().toISOString(),
            outcome_hash: outcomeHash,
            resolution_report: report,
          })
          .eq("id", pred.id);
        console.log("Marked resolved without payouts (no pool).");
        continue;
      }

      const { data: stakes, error: stakesErr } = await supabase
        .from("user_prediction_stakes")
        .select("*")
        .eq("prediction_id", pred.id);

      if (stakesErr) {
        console.error("Failed to fetch stakes:", stakesErr.message);
      }

      const poolYes = Number(poolData.total_yes || 0);
      const poolNo = Number(poolData.total_no || 0);

      const payouts = computePayouts(poolYes, poolNo, stakes || [], outcome);

      console.log("Computed payouts:", payouts);

      // apply payouts: update stake rows, call increment_user_balance RPC, insert transactions
      for (const p of payouts) {
        try {
          // Update user_prediction_stakes payout_credits + resolved_at
          const { error: updErr } = await supabase
            .from("user_prediction_stakes")
            .update({ payout_credits: p.payout_credits, resolved_at: new Date().toISOString() })
            .eq("id", p.stakeRowId);
          if (updErr) {
            console.error("Failed updating stake row", p.stakeRowId, updErr.message);
          }

          // Call RPC to increment user balance atomically
          const { error: rpcErr } = await supabase.rpc("increment_user_balance", {
            user_id_input: p.user_id,
            amount: Math.round(p.payout_credits), // RPC expects integer
          });
          if (rpcErr) {
            console.error("RPC increment_user_balance failed for user", p.user_id, rpcErr.message);
            // fallback: attempt direct update (less safe), but still attempt:
            const { data: usr } = await supabase.from("users").select("real_credits_balance").eq("id", p.user_id).single();
            const current = Number(usr?.real_credits_balance || 0);
            const { error: fallbackErr } = await supabase.from("users").update({ real_credits_balance: current + Math.round(p.payout_credits) }).eq("id", p.user_id);
            if (fallbackErr) {
              console.error("Fallback balance update failed for user", p.user_id, fallbackErr.message);
            } else {
              console.log("Fallback balance update succeeded for user", p.user_id);
            }
          } else {
            // insert transaction ledger entry (payout)
            await supabase.from("transactions").insert({
              user_id: p.user_id,
              type: "payout",
              amount: Math.round(p.payout_credits),
              tx_hash: null,
              status: "confirmed",
              created_at: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error("Error applying payout for", p.user_id, e);
        }
      }

      // finally update prediction row with resolution
      const { error: updPredErr } = await supabase
        .from("predictions")
        .update({
          status: "resolved",
          outcome_value: outcome,
          resolved_price: final,
          resolved_timestamp: new Date().toISOString(),
          outcome_hash: outcomeHash,
          resolution_report: report,
        })
        .eq("id", pred.id);

      if (updPredErr) {
        console.error("Failed updating prediction resolved fields:", updPredErr.message);
      } else {
        console.log(`✅ Prediction ${pred.id} resolved -> ${outcome} at ${final} (hash: ${outcomeHash})`);
      }
    } catch (err) {
      console.error("Resolver loop error for prediction", pred.id, err);
      // attempt to reset status if we had set resolving earlier (we didn't claim in this version), left as pending for retry
    }
  } // end for
}

// If run directly
if (require.main === module) {
  (async () => {
    await runResolver(100);
    process.exit(0);
  })().catch((e) => {
    console.error("Agent-3 fatal:", e);
    process.exit(1);
  });
}
