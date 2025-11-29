// agents/test/yahoo-test.ts

// Node 18+ has fetch globally. If you're on older Node, uncomment:
// import fetch from "node-fetch";

async function testYahoo() {
  const symbol = "SQ"; // Test ticker

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
    const openingPrice = getOpeningPrice(data?.chart?.result?.[0]);
    // console.log(meta);
    if (!meta) {
      console.error("❌ No meta data found in response.");
      console.dir(data, { depth: 5 });
      return;
    }

    console.log("✅ Yahoo Finance Data Received:");
    console.log({
      symbol: meta.symbol,
      regularMarketPrice: meta.regularMarketPrice,
      regularMarketOpen: openingPrice,
      regularMarketDayHigh: meta.regularMarketDayHigh,
      regularMarketDayLow: meta.regularMarketDayLow,
      currentTimestamp: meta.regularMarketTime,
    });

  } catch (err: any) {
    console.error("❌ Fetch failed:", err.message);
  }
}
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

testYahoo();
