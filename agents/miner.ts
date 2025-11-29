/**
 * Miner Option-D v3
 * -----------------
 * ✔ Puppeteer scraping (bypasses 247WallSt / MarketWatch protection)
 * ✔ Cheerio parsing
 * ✔ Free LLM (local Ollama / LM Studio)
 * ✔ Extracts only STOCK-RELEVANT news
 * ✔ Extracts ticker + sentiment + relevance score
 * ✔ Clean console output for Agent-2 testing
 */

import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

// ------------------------- CONFIG -------------------------

// Local free LLM endpoint (Ollama / LM Studio)
// Change this if needed
const LLM_URL = "http://127.0.0.1:11434/api/generate";

// 247WallSt is Cloudflare protected → must use puppeteer
const STOCK_SOURCES = [
  {
    name: "247WallSt",
    url: "https://247wallst.com/investing/",
    selector: "a",
  },
  {
    name: "FinancialExpress",
    url: "https://www.financialexpress.com/market/",
    selector: "a",
  },
  {
    name: "MarketWatch",
    url: "https://www.marketwatch.com/",
    selector: "a",
  },
];

// -----------------------------------------------------------
// Helper: fetch page with puppeteer (bypasses Cloudflare)
// -----------------------------------------------------------

async function fetchWithPuppeteer(url: string): Promise<string | null> {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const html = await page.content();

    await browser.close();
    return html;
  } catch (err) {
    console.error("❌ Puppeteer fetch failed:", err);
    return null;
  }
}

// -----------------------------------------------------------
// Helper: send text to free local LLM (Ollama)
// -----------------------------------------------------------

async function askLLM(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      LLM_URL,
      {
        model: "qwen2.5:1.5b", // VERY small model, safe for daily scraping
        prompt,
        stream: false,
      },
      { timeout: 30000 }
    );

    return response.data.response.trim();
  } catch (err) {
    console.error("❌ LLM error", err);
    return "LLM_ERROR";
  }
}

// -----------------------------------------------------------
// Extract headline + full text
// -----------------------------------------------------------

async function scrapeArticle(url: string) {
  const html = await fetchWithPuppeteer(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim();
  let paragraphs = $("p")
    .map((_, el) => $(el).text())
    .get()
    .join(" ");

  // Clean
  const text = paragraphs.replace(/\s+/g, " ").trim();

  if (!title || !text) return null;

  // ----------- Ask LLM to check relevance & extract ticker ----------
  const llmPrompt = `
You are a financial news interpreter.
Given the article below, respond ONLY in JSON:

{
  "is_stock_related": true/false,
  "ticker": "TSLA",
  "sentiment": "up" | "down" | "neutral",
  "score": 0-100,
  "summary": "one sentence summary"
}

Article:
"${title}"
"${text}"
  `;

  const llmResult = await askLLM(llmPrompt);

  try {
    const parsed = JSON.parse(llmResult);

    return {
      url,
      title,
      text,
      ...parsed,
    };
  } catch (err) {
    console.log("❌ Failed to parse LLM JSON for:", title);
    return null;
  }
}

// -----------------------------------------------------------
// Extract article links from index page
// -----------------------------------------------------------

async function scrapeIndex(source: any): Promise<string[]> {
  console.log(`Index: fetching ${source.name} ${source.url}`);

  const html = await fetchWithPuppeteer(source.url);
  if (!html) return [];

  const $ = cheerio.load(html);

  // extract all article-like links
  let links = new Set<string>();

  $(source.selector).each((_, el) => {
    let href = $(el).attr("href");
    if (!href) return;

    if (!href.startsWith("http")) {
      href = source.url + href;
    }

    // Keep only article-like pages
    if (
      href.includes("/202") ||
      href.includes("/investing/") ||
      href.includes("/markets/")
    ) {
      links.add(href);
    }
  });

  return [...links];
}

// -----------------------------------------------------------
// MASTER MINING FUNCTION
// -----------------------------------------------------------

export async function runMiner() {
  console.log("⛏ Fetching stock news…\n");

  let articles: any[] = [];

  for (const src of STOCK_SOURCES) {
    try {
      const links = await scrapeIndex(src);

      for (let url of links.slice(0, 15)) {
        const data = await scrapeArticle(url);
        if (data && data.is_stock_related && data.ticker) {
          articles.push(data);
        }
      }
    } catch (err: any) {
      console.error(`❌ Error scraping ${src.name}:`, err.message);
    }
  }

  console.log("\n---------------- FINAL RESULTS ----------------\n");
  console.log(JSON.stringify(articles, null, 2));
  console.log(`\nTotal relevant stock articles: ${articles.length}\n`);
}

runMiner();