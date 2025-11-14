/**
 * Run with:
 *   ts-node agents/test/miner.test.ts
 *
 * Requires:
 *   GROQ_API_KEY=xxxx
 */

import fs from "fs";
import Parser from "rss-parser";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";
import Groq from "groq-sdk";

// --------------------------
// Types
// --------------------------

interface ExtractedPrediction {
  rawText: string;
  extractedPrediction: string;
  asset_hint?: string;
  asset_preferred?: string | null;
  predicted_move?: string | null;
  target_value?: number | null;
  expiry_hint?: string | null;
  suggested_expiry_iso?: string | null;
  confidence?: number;
}

interface MinedPrediction extends ExtractedPrediction {
  id: string;
  source: string;
  source_url: string;
}

// --------------------------

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const rssFeeds: string[] = [
  "https://cointelegraph.com/rss",
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://finance.yahoo.com/rss/topstories",
  "https://www.marketwatch.com/rss/topstories",
];

// --------------------------
// HTML Extraction
// --------------------------

function extractArticleText(html: string): string {
  const $ = cheerio.load(html);

  let paragraphs = $("article p");
  if (paragraphs.length === 0) paragraphs = $("p");

  let text = "";
  paragraphs.each((_, el) => {
    text += $(el).text() + "\n";
  });

  return text.trim();
}

// --------------------------
// Prompt
// --------------------------

function buildPrompt(articleText: string, url: string): string {
  return `
You extract **financial predictions** from text.

Return ONLY a JSON array like:

[
  {
    "rawText": "...",
    "extractedPrediction": "BTC will reach $97,000 by Friday",
    "asset_hint": "BTC",
    "asset_preferred": "BTCUSDT",
    "predicted_move": "UP",
    "target_value": 97000,
    "expiry_hint": "by Friday",
    "suggested_expiry_iso": "2025-01-27T18:00:00Z",
    "confidence": 0.92
  }
]

Rules:
- Only include numeric, time-bound predictions.
- If none exist, output [].
- asset_preferred may be null.
- suggested_expiry_iso must be ISO8601 UTC if possible.
- NO commentary.

URL: ${url}

TEXT:
"""
${articleText}
"""
  `.trim();
}

// --------------------------
// LLM Call
// --------------------------

async function callLLM(prompt: string): Promise<ExtractedPrediction[]> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You extract structured predictions only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  const content = completion.choices[0].message?.content || "";

  try {
    return JSON.parse(content);
  } catch {
    // try fallback
    const match = content.match(/\[.*\]/s);
    if (!match) return [];
    try {
      return JSON.parse(match[0]);
    } catch {
      return [];
    }
  }
}

// --------------------------
// SAFE fetch with timeout
// --------------------------

async function safeFetch(url: string, ms = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);

    const res = await fetch(url, { signal: controller.signal as any });
    clearTimeout(timeout);

    return await res.text();
  } catch (err) {
    return null;
  }
}

// --------------------------
// MAIN MINER
// --------------------------

const parser = new Parser();

async function main() {
  const results: MinedPrediction[] = [];

  fs.mkdirSync("agents/test-output", { recursive: true });

  for (const feed of rssFeeds) {
    console.log(`\n🔵 Fetching RSS: ${feed}`);

    let feedData: any;
    try {
      feedData = await parser.parseURL(feed);
    } catch (err) {
      console.log("RSS Error:", (err as Error).message);
      continue;
    }

    const items = feedData.items.slice(0, 10);

    for (const item of items) {
      const url: string = item.link || "";
      let text: string = item.contentSnippet || item.summary || item.content || "";

      if (text.length < 200 && url) {
        const html = await safeFetch(url);
        if (html) {
          const articleText = extractArticleText(html);
          if (articleText.length > text.length) {
            text = articleText;
          }
        }
      }

      if (text.length < 80) continue;

      const prompt = buildPrompt(text, url);
      let extracted: ExtractedPrediction[];

      try {
        extracted = await callLLM(prompt);
      } catch (err) {
        console.log("LLM Error:", (err as Error).message);
        continue;
      }

      if (!Array.isArray(extracted) || extracted.length === 0) continue;

      for (const p of extracted) {
        results.push({
          id: uuidv4(),
          source: feedData.title || feed,
          source_url: url,
          rawText: p.rawText,
          extractedPrediction: p.extractedPrediction,
          asset_hint: p.asset_hint?.toUpperCase(),
          asset_preferred: p.asset_preferred ?? null,
          predicted_move: p.predicted_move ?? null,
          target_value: p.target_value ?? null,
          expiry_hint: p.expiry_hint ?? null,
          suggested_expiry_iso: p.suggested_expiry_iso ?? null,
          confidence: p.confidence ?? 0.5,
        });

        console.log("🟢 Prediction:", p.extractedPrediction);
      }
    }
  }

  fs.writeFileSync(
    "agents/test-output/mined.json",
    JSON.stringify(results, null, 2)
  );

  console.log(`\n✅ Finished. Total predictions: ${results.length}`);
  console.log("📁 Saved to agents/test-output/mined.json");
}

main();
