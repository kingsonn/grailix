import "dotenv/config";
import Groq from "groq-sdk";
import Parser from "rss-parser";
import { extractJson } from "./utils/cleanJson";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const parser = new Parser();

// --------------------------------------------------------------
//  RSS SOURCES (crypto + stocks + analyst upgrades)
// --------------------------------------------------------------
export const RSS_FEEDS = [
  // Crypto (worked for you)
  "https://feeds.feedburner.com/CoinDesk",
  "https://cryptonews.com/news/feed/",
  "https://ambcrypto.com/feed/",
  "https://u.today/rss",

  // Forex / multi-asset analysis
  "https://www.fxstreet.com/rss",

  // STOCKS + ANALYST UPGRADES (New!)
  "https://www.theglobeandmail.com/business/rob-magazine/feed/",
  "https://www.investorschronicle.co.uk/feed/",
  "https://www.tradingview.com/news/atom/rss/",
  "https://www.businessinsider.com/sai/us-markets/rss",
  "https://www.fool.com/feeds/index.aspx",
];

// --------------------------------------------------------------
//  TICKER MAPPING (NYSE + NASDAQ)
// --------------------------------------------------------------
export async function guessTicker(company: string): Promise<string | null> {
  const map: Record<string, string> = {
    // Add as needed — common ones
    "Apple": "AAPL",
    "Microsoft": "MSFT",
    "Amazon": "AMZN",
    "Nvidia": "NVDA",
    "Meta": "META",
    "Tesla": "TSLA",
    "AMD": "AMD",
    "Alphabet": "GOOGL",
    "Alphabet Inc": "GOOGL",
    "Google": "GOOGL",
    "Netflix": "NFLX",
  };

  // Soft match by keyword
  for (const key of Object.keys(map)) {
    if (company.toLowerCase().includes(key.toLowerCase())) {
      return map[key];
    }
  }

  return null;
}

// --------------------------------------------------------------
//  LLM Extraction Prompt
// --------------------------------------------------------------
function buildLLMPrompt(article: string): string {
  return `
Extract ONLY explicit numeric predictions from this article.

What counts as a prediction:
- Analyst upgrades/downgrades with price targets
- Price predictions like "$260 target", "$100 by Friday", "up 2% today"
- Crypto predictions like "BTC will reach $97k"
- DO NOT invent anything.

Return JSON ONLY with this format:

{
  "predictions": [
     {
       "raw_text": "...",
       "prediction_text": "...",
       "asset": "...",
       "target_price": "... or null",
       "direction": "UP | DOWN | UNKNOWN",
       "source": "...",
       "long_term": true | false
     }
  ]
}

Rules:
- If article contains a price target (like "Buy with $260 target"), mark long_term=true.
- If target is short-term ("by tomorrow", "today", "this week"), mark long_term=false.
- Asset can be ticker ("AAPL") or crypto ("BTCUSDT").
- If unsure, leave field null.
- No explanation.
- JSON ONLY.
  
ARTICLE:
${article}
  `;
}

// --------------------------------------------------------------
//  Miner Function
// --------------------------------------------------------------
export async function minePredictionsFromRSS(): Promise<any[]> {
  const finalPredictions: any[] = [];

  for (const feed of RSS_FEEDS) {
    console.log(`\n🔵 Fetching RSS: ${feed}`);

    let rss;
    try {
      rss = await parser.parseURL(feed);
    } catch (err) {
      console.log("RSS Error:", (err as any).message);
      continue;
    }

    if (!rss.items) continue;

    for (const item of rss.items) {
      const title = item.title || "";
      const content = item.contentSnippet || item.content || "";

      const articleText = `${title}\n${content}`;

      // -------- Run LLM extraction --------
      let llmResponse;
      try {
        const output = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: buildLLMPrompt(articleText) }],
          temperature: 0.2,
        });

        const raw = output.choices[0].message?.content || "{}";
        llmResponse = extractJson(raw);
        if (!llmResponse) {
          console.log("LLM JSON extraction error");
          continue;
        }
      } catch (err) {
        console.log("LLM Error:", (err as any).message);
        continue;
      }

      if (!llmResponse?.predictions) continue;

      for (const p of llmResponse.predictions) {
        // Detect ticker if not provided
        let asset = p.asset;

        if (!asset) {
          const possibleTicker = await guessTicker(p.raw_text || "");
          if (possibleTicker) asset = possibleTicker;
        }

        if (!asset) continue;

        console.log(`🟢 Prediction: ${p.prediction_text}`);

        finalPredictions.push({
          raw_text: p.raw_text,
          prediction_text: p.prediction_text,
          asset,
          target_price: p.target_price || null,
          direction: p.direction || "UNKNOWN",
          source: p.source || feed,
          long_term: p.long_term ?? false,
        });
      }
    }
  }

  return finalPredictions;
}
