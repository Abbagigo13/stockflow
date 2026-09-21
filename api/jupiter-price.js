/* global process */

const JUPITER_PRICE_API = "https://api.jup.ag/price/v3";
const CACHE_TTL_MS = 10 * 1000;
const STALE_MAX_MS = 5 * 60 * 1000;
const MAX_IDS = 20;
const MAX_CACHE_ENTRIES = 200;

// Solana token addresses are base58 strings of 32-44 characters.
const MINT_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// mint -> { at, data }. Shared by every request this server instance handles.
const cache = new Map();

async function fetchFromJupiter(mints, apiKey) {
  const response = await fetch(
    `${JUPITER_PRICE_API}?ids=${mints.join(",")}`,
    {
      headers: {
        "x-api-key": apiKey,
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

  const apiKey = (process.env.JUPITER_API_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "Jupiter API key is not configured on the server.",
    });
  }

  const raw = typeof req.query.ids === "string" ? req.query.ids : "";

  const mints = [
    ...new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];

  if (
    mints.length === 0 ||
    mints.length > MAX_IDS ||
    !mints.every((mint) => MINT_PATTERN.test(mint))
  ) {
    return res.status(400).json({
      success: false,
      error: `Provide 1 to ${MAX_IDS} valid Solana token addresses in ids`,
    });
  }

  const now = Date.now();
  const prices = {};
  const missing = [];

  for (const mint of mints) {
    const hit = cache.get(mint);

    if (hit && now - hit.at < CACHE_TTL_MS) {
      prices[mint] = hit.data;
    } else {
      missing.push(mint);
    }
  }

  let cacheState = "HIT";

  if (missing.length > 0) {
    cacheState = "MISS";

    try {
      const result = await fetchFromJupiter(missing, apiKey);

      if (
        result.ok &&
        result.body &&
        typeof result.body === "object"
      ) {
        for (const mint of missing) {
          const data = result.body[mint];

          if (data) {
            prices[mint] = data;
            cache.set(mint, { at: now, data });
          }
        }
      } else {
        // Jupiter refused (for example rate limited).
        // Serve recent values when we have them.
        cacheState = "STALE";

        for (const mint of missing) {
          const old = cache.get(mint);

          if (old && now - old.at < STALE_MAX_MS) {
            prices[mint] = old.data;
          }
        }

        const stillMissing = missing.filter(
          (mint) => !(mint in prices)
        );

        if (stillMissing.length > 0) {
          const limited = result.status === 429;

          return res.status(limited ? 429 : 502).json({
            success: false,
            error: limited
              ? "Jupiter price data is temporarily rate limited."
              : `Jupiter price request failed (${result.status})`,
          });
        }
      }
    } catch (error) {
      console.error("[StockFlow] jupiter-price error:", error);

      return res.status(500).json({
        success: false,
        error: "Unable to reach Jupiter",
      });
    }
  }

  while (cache.size > MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }

  res.setHeader("X-Cache", cacheState);
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=30"
  );

  return res.status(200).json(prices);
}