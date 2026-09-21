/* global process */

const BIRDEYE_API = "https://public-api.birdeye.so";
const CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

const RANGES = {
  "1H": { seconds: 60 * 60, type: "1m" },
  "1D": { seconds: 24 * 60 * 60, type: "15m" },
  "1W": { seconds: 7 * 24 * 60 * 60, type: "1H" },
  "1M": { seconds: 30 * 24 * 60 * 60, type: "4H" },
};

// Solana token addresses are base58 strings of 32-44 characters.
const MINT_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Memory cache for this server instance, plus shared in-flight requests.
const cache = new Map();
const inflight = new Map();

async function fetchFromBirdeye(mint, timeframe, apiKey) {
  const range = RANGES[timeframe];
  const now = Math.floor(Date.now() / 1000);

  const params = new URLSearchParams({
    address: mint,
    address_type: "token",
    type: range.type,
    time_from: String(now - range.seconds),
    time_to: String(now),
    ui_amount_mode: "scaled",
  });

  const response = await fetch(
    `${BIRDEYE_API}/defi/history_price?${params.toString()}`,
    {
      headers: {
        "X-API-KEY": apiKey,
        "x-chain": "solana",
        accept: "application/json",
      },
    }
  );

  const text = await response.text();

  let body;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return { status: response.status, ok: response.ok, body };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

    const apiKey = (process.env.BIRDEYE_API_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error:
        "Birdeye API key is not configured on the server. Add BIRDEYE_API_KEY to .env.local and restart vercel dev.",
    });
  }

  const { mint, timeframe = "1D" } = req.query;

  if (typeof mint !== "string" || !MINT_PATTERN.test(mint)) {
    return res.status(400).json({
      success: false,
      error: "A valid Solana token address is required",
    });
  }

  if (typeof timeframe !== "string" || !RANGES[timeframe]) {
    return res.status(400).json({
      success: false,
      error: "Timeframe must be 1H, 1D, 1W or 1M",
    });
  }

  const cacheKey = `${mint}:${timeframe}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader("X-Cache", "HIT");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=300"
    );

    return res.status(200).json(cached.body);
  }

  try {
    let request = inflight.get(cacheKey);

    if (!request) {
      request = fetchFromBirdeye(mint, timeframe, apiKey).finally(
        () => inflight.delete(cacheKey)
      );

      inflight.set(cacheKey, request);
    }

    const result = await request;

    if (result.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Historical data is temporarily rate limited.",
      });
    }

        if (result.status === 401 || result.status === 403) {
      return res.status(502).json({
        success: false,
                       error:
          "Birdeye rejected the API key. Check BIRDEYE_API_KEY in your Vercel project settings.",
      });
    }

    if (!result.ok || !result.body) {
      return res.status(502).json({
        success: false,
        error: `Birdeye request failed (${result.status})`,
      });
    }

    if (cache.size >= MAX_CACHE_ENTRIES) {
      cache.delete(cache.keys().next().value);
    }

    cache.set(cacheKey, { at: Date.now(), body: result.body });

    res.setHeader("X-Cache", "MISS");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=300"
    );

    return res.status(200).json(result.body);
  } catch (error) {
    console.error("[StockFlow] price-history error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to reach Birdeye",
    });
  }
}