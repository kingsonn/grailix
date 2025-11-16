// agents/test/yahoo-test.ts

// Node 18+ has fetch globally. If you're on older Node, uncomment:
// import fetch from "node-fetch";

async function testYahoo() {
  const symbol = "AAPL"; // Test ticker

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m`;

  console.log("🔵 Fetching:", url);

  try {
    const res = await fetch(url);
    console.log("✅ Fetch successful");
    if (!res.ok) {
      console.error("❌ HTTP Error:", res.status, res.statusText);
      return;
    }
    console.log("✅ HTTP OK");
    const data = await res.json();
    console.log(data?.chart?.result);
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) {
      console.error("❌ No meta data found in response.");
      console.dir(data, { depth: 5 });
      return;
    }

    console.log("✅ Yahoo Finance Data Received:");
    console.log({
      symbol: meta.symbol,
      regularMarketPrice: meta.regularMarketPrice,
      regularMarketOpen: meta.regularMarketOpen,
      regularMarketDayHigh: meta.regularMarketDayHigh,
      regularMarketDayLow: meta.regularMarketDayLow,
      currentTimestamp: meta.regularMarketTime,
    });

  } catch (err: any) {
    console.error("❌ Fetch failed:", err.message);
  }
}

testYahoo();
