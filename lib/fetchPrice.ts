import axios from "axios";

/**
 * Fetch current price for an asset from Binance API
 * Used by resolver agent to determine prediction outcomes
 */
export async function fetchPrice(asset: string): Promise<number | null> {
  try {
    // Normalize asset symbol (e.g., "BTC" -> "BTCUSDT")
    const symbol = asset.toUpperCase().includes("USDT") ? asset : `${asset}USDT`;

    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price`, {
      params: { symbol },
    });

    if (response.data && response.data.price) {
      return parseFloat(response.data.price);
    }

    return null;
  } catch (error) {
    console.error(`Error fetching price for ${asset}:`, error);
    return null;
  }
}

/**
 * Fetch price with retry logic (for resolver agent)
 */
export async function fetchPriceWithRetry(
  asset: string,
  maxRetries: number = 3
): Promise<number | null> {
  for (let i = 0; i < maxRetries; i++) {
    const price = await fetchPrice(asset);
    if (price !== null) {
      return price;
    }
    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
  }
  return null;
}
