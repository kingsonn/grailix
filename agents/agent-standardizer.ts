// agents/agent-standardizer.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { DateTime } from "luxon";

if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  throw new Error("Missing Supabase env vars");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ---------- Helpers ----------
function isProbablyCrypto(ticker: string) {
  // crude heuristic: crypto tickers often include USD or USDT or are short uppercase
  const t = (ticker || "").toUpperCase();
  return t.endsWith("USDT") || t.endsWith("USD") || t.length <= 5 && /[A-Z]/.test(t);
}

function getExpiryForStockNowUSClose() {
  // US market close 16:00 America/New_York -> convert to UTC ISO
  const nowNY = DateTime.now().setZone("America/New_York");
  let closeToday = nowNY.set({ hour: 16, minute: 0, second: 0, millisecond: 0 });
  if (nowNY >= closeToday) {
    // if already past close, set to next calendar day close (simple approach)
    closeToday = closeToday.plus({ days: 1 });
  }
  return closeToday.toUTC().toISO();
}

function getExpiryForCrypto() {
  return DateTime.utc().plus({ hours: 6 }).toISO();
}

// ---------- LLM prompt builder ----------
function buildNormalizationPrompt(rawText: string, ticker: string) {
  return `
You are a precise financial prediction normalizer.  
You will convert the RAW text into a short list (2-4) of short-term, resolvable YES/NO prediction cards tied to the provided ticker.

RAW TEXT:
"""${rawText}"""

TICKER: ${ticker}

Output STRICT JSON ONLY with THIS schema:

{
  "cards": [
    {
      "text": "Will ${ticker} ... ?",
      "type": "YES_NO",
      "notes": "optional short note (<=30 chars)"
    }
  ]
}

Rules:
- Each card must be measurable using price data (open/close/percent change) at expiry.
- Prefer same-day short-term cards (intraday/day close). No multi-week/month items.
- Use 2 to 4 cards.
- Do not include probabilities or long explanations.
- Output valid JSON only.
`;
}

// ---------- Core processing for a single raw row ----------
async function processRow(row: {
  id: string;
  raw_text: string;
  ticker: string;
  asset_type?: string | null;
  source_name?: string | null;
  source_url?: string | null;
}) {
  const { id, raw_text, ticker, asset_type, source_name, source_url } = row;

  console.log(`Processing raw id=${id} ticker=${ticker}`);

  // Build prompt
  const prompt = buildNormalizationPrompt(raw_text, ticker);

  // Call Groq LLM
  let llmResponse: any = null;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
      // set a reasonable max tokens if supported in config (sdk-dependent)
    });

    // groq SDK returns content under completion.choices[0].message.content
    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty LLM response");
    }
    llmResponse = content; // already a JS object because response_format json_object
  } catch (err) {
    console.error("LLM error for id=", id, err);
    // fallback: create a simple card from raw text
    llmResponse = { cards: [`Will ${ticker} close higher today?`].map((t) => ({ text: t, type: "YES_NO" })) };
  }

  // Normalize llmResponse.cards to array of {text}
  const cardsRaw: { text: string }[] = Array.isArray(llmResponse?.cards)
    ? llmResponse.cards.map((c: any) => ({ text: c.text || String(c) }))
    : [];

  // default fallback if weird output
  if (cardsRaw.length === 0) {
    cardsRaw.push({ text: `Will ${ticker} close higher today?` });
  }

  // Determine expiry per card (stock vs crypto)
  // Use asset_type if available, otherwise fallback to heuristic
  const normalizedAssetType = (asset_type || "").toLowerCase();
  const isCrypto = normalizedAssetType === "crypto" || (normalizedAssetType !== "stock" && isProbablyCrypto(ticker));
  const expiry = isCrypto ? getExpiryForCrypto() : getExpiryForStockNowUSClose();
  const finalAssetType = normalizedAssetType === "crypto" || normalizedAssetType === "stock" ? normalizedAssetType : (isCrypto ? "crypto" : "stock");

  // Insert each card into predictions table
  for (const card of cardsRaw) {
    try {
      const insertRes = await supabase.from("predictions").insert({
        prediction_text: card.text,
        source_name: source_name || null,
        source_category: "Analyst",
        asset: ticker,
        asset_type: finalAssetType,
        raw_text: raw_text,
        expiry_timestamp: expiry,
        sentiment_yes: 0,
        sentiment_no: 0,
        status: "pending",
      });

      if (insertRes.error) {
        console.error("Failed to insert prediction for id", id, insertRes.error);
      } else {
        console.log("Inserted prediction:", card.text);
      }
    } catch (err) {
      console.error("Exception inserting prediction for id", id, err);
    }
  }

  // Mark ai_raw_inputs row processed = TRUE
  try {
    const { error } = await supabase.from("ai_raw_inputs").update({ processed: true }).eq("id", id);
    if (error) {
      console.error("Failed to mark raw row processed id=", id, error);
    } else {
      console.log("Marked raw id processed:", id);
    }
  } catch (err) {
    console.error("Error marking processed id=", id, err);
  }
}

// ---------- Public runner: process a set of ids OR fallback to all unprocessed ----------
export async function runAgent2ForIds(ids?: string[]) {
  console.log("Agent-2 start. ids?", ids?.length ?? "none");

  let rows: any[] = [];

  if (Array.isArray(ids) && ids.length > 0) {
    const { data, error } = await supabase.from("ai_raw_inputs").select("*").in("id", ids);
    if (error) {
      console.error("Failed to fetch ai_raw_inputs by ids", error);
      return;
    }
    rows = data || [];
  } else {
    // fallback: process unprocessed rows (safe)
    const { data, error } = await supabase.from("ai_raw_inputs").select("*").eq("processed", false).limit(20);
    if (error) {
      console.error("Failed to fetch ai_raw_inputs", error);
      return;
    }
    rows = data || [];
  }

  if (!rows.length) {
    console.log("Nothing to process in Agent-2.");
    return;
  }

  for (const row of rows) {
    try {
      await processRow(row);
    } catch (err) {
      console.error("Error processing row id=", row.id, err);
    }
  }

  console.log("Agent-2 done.");
}

// Run as CLI if executed directly
if (require.main === module) {
  (async () => {
    await runAgent2ForIds(); // fallback -> process unprocessed rows
  })().catch((e) => {
    console.error("Agent-2 fatal:", e);
    process.exit(1);
  });
}
