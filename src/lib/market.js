const XSTOCKS_API =
  "https://api.xstocks.fi/api/v2/public";

const JUPITER_API =
  "https://api.jup.ag/price/v3";

const BIRDEYE_API =
  "https://public-api.birdeye.so";

/*
 * Historical chart cache.
 *
 * Successful responses are cached for 2 minutes.
 * Requests already in progress are shared so we
 * don't accidentally send duplicate API requests.
 */
const historicalCache = new Map();
const historicalRequests = new Map();

const HISTORICAL_CACHE_DURATION =
  2 * 60 * 1000;


/* =========================================================
   XSTOCKS
========================================================= */

export async function fetchAsset(symbol) {
  const response = await fetch(
    `${XSTOCKS_API}/assets/${encodeURIComponent(symbol)}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${symbol} asset`
    );
  }

  return response.json();
}


/* =========================================================
   JUPITER
========================================================= */

export async function fetchJupiterPrice(mint) {
  const response = await fetch(
    `${JUPITER_API}?ids=${encodeURIComponent(mint)}`
  );

  if (!response.ok) {
    throw new Error(
      "Jupiter price request failed"
    );
  }

  const data = await response.json();

  return data[mint] || null;
}


/* =========================================================
   SOLANA DEPLOYMENT
========================================================= */

export function getSolanaDeployment(asset) {
  const deployments =
    asset?.deployments ||
    asset?.networks ||
    [];

  return (
    deployments.find(
      (deployment) =>
        deployment?.network?.toLowerCase() ===
        "solana"
    ) || null
  );
}


/* =========================================================
   HISTORICAL DATA HELPERS
========================================================= */

function getHistoricalCacheKey(
  mint,
  timeframe
) {
  return `${mint}:${timeframe}`;
}


/*
 * Convert Birdeye historical-price responses
 * into the format used by StockChart.
 *
 * Output:
 *
 * [
 *   {
 *     timestamp: 1234567890000,
 *     price: 218.50
 *   }
 * ]
 */
function normalizeHistoricalData(result) {
  const rawData = result?.data;

  if (!rawData) {
    return [];
  }


  /*
   * Standard Birdeye response:
   *
   * data: {
   *   items: [
   *     {
   *       unix_time: 1234567890,
   *       value: 218.50
   *     }
   *   ]
   * }
   */
  if (Array.isArray(rawData?.items)) {
    return rawData.items
      .map((item) => {
        const timestamp =
          Number(
            item?.unix_time ??
              item?.unixTime ??
              item?.timestamp ??
              item?.time
          ) * 1000;

        const price =
          Number(
            item?.value ??
              item?.price ??
              item?.valueUsd ??
              item?.priceUsd
          );

        return {
          timestamp,
          price,
        };
      })
      .filter(
        (item) =>
          Number.isFinite(
            item.timestamp
          ) &&
          Number.isFinite(
            item.price
          ) &&
          item.price > 0
      );
  }


  /*
   * Some API responses can expose
   * timestamps and values separately.
   */
  if (
    Array.isArray(
      rawData?.unix_time
    ) &&
    Array.isArray(
      rawData?.value
    )
  ) {
    return rawData.unix_time
      .map((time, index) => ({
        timestamp:
          Number(time) * 1000,

        price:
          Number(
            rawData.value[index]
          ),
      }))
      .filter(
        (item) =>
          Number.isFinite(
            item.timestamp
          ) &&
          Number.isFinite(
            item.price
          ) &&
          item.price > 0
      );
  }


  /*
   * Generic array fallback.
   */
  if (Array.isArray(rawData)) {
    return rawData
      .map((item) => ({
        timestamp:
          Number(
            item?.unix_time ??
              item?.unixTime ??
              item?.timestamp ??
              item?.time
          ) * 1000,

        price:
          Number(
            item?.value ??
              item?.price ??
              item?.valueUsd ??
              item?.priceUsd
          ),
      }))
      .filter(
        (item) =>
          Number.isFinite(
            item.timestamp
          ) &&
          Number.isFinite(
            item.price
          ) &&
          item.price > 0
      );
  }

  return [];
}


/* =========================================================
   BIRDEYE HISTORICAL PRICE
========================================================= */

async function fetchHistoricalPriceSeries(
  mint,
  timeframe
) {
  const apiKey =
    import.meta.env
      .VITE_BIRDEYE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Birdeye API key is missing. Add VITE_BIRDEYE_API_KEY to .env.local."
    );
  }

  const now =
    Math.floor(
      Date.now() / 1000
    );


  /*
   * Timeframe configuration.
   */
  const ranges = {
    "1H": {
      seconds:
        60 * 60,
      type: "1m",
    },

    "1D": {
      seconds:
        24 * 60 * 60,
      type: "15m",
    },

    "1W": {
      seconds:
        7 * 24 * 60 * 60,
      type: "1H",
    },

    "1M": {
      seconds:
        30 * 24 * 60 * 60,
      type: "4H",
    },
  };

  const selected =
    ranges[timeframe] ||
    ranges["1D"];

  const timeFrom =
    now - selected.seconds;


  const params =
    new URLSearchParams({
      address: mint,
      address_type: "token",
      type: selected.type,
      time_from:
        String(timeFrom),
      time_to:
        String(now),
      ui_amount_mode:
        "scaled",
    });


  const url =
    `${BIRDEYE_API}/defi/history_price?${params.toString()}`;


  const response =
    await fetch(url, {
      headers: {
        "X-API-KEY":
          apiKey,

        "x-chain":
          "solana",
      },
    });


  if (!response.ok) {
    const text =
      await response.text();

    if (
      response.status === 429
    ) {
      throw new Error(
        "Historical data is temporarily rate limited."
      );
    }

    throw new Error(
      `Historical price request failed: ${response.status} ${text}`
    );
  }


  const result =
    await response.json();


  /*
   * Temporary debugging.
   *
   * This lets us inspect exactly what
   * Birdeye sends back.
   */
  console.log(
    "[StockFlow] Birdeye historical response:",
    result
  );


  return normalizeHistoricalData(
    result
  );
}


/* =========================================================
   BIRDEYE OHLCV FALLBACK
========================================================= */

/*
 * OHLCV is designed specifically for
 * market charts.
 *
 * If history_price returns zero points,
 * we try this endpoint.
 */
async function fetchHistoricalOHLCV(
  mint,
  timeframe
) {
  const apiKey =
    import.meta.env
      .VITE_BIRDEYE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Birdeye API key is missing. Add VITE_BIRDEYE_API_KEY to .env.local."
    );
  }

  const now =
    Math.floor(
      Date.now() / 1000
    );


  const ranges = {
    "1H": {
      seconds:
        60 * 60,
      type: "1m",
    },

    "1D": {
      seconds:
        24 * 60 * 60,
      type: "15m",
    },

    "1W": {
      seconds:
        7 * 24 * 60 * 60,
      type: "1H",
    },

    "1M": {
      seconds:
        30 * 24 * 60 * 60,
      type: "4H",
    },
  };


  const selected =
    ranges[timeframe] ||
    ranges["1D"];


  const timeFrom =
    now - selected.seconds;


  const params =
    new URLSearchParams({
      address: mint,
      address_type: "token",
      type: selected.type,
      time_from:
        String(timeFrom),
      time_to:
        String(now),
      currency: "usd",
      ui_amount_mode:
        "scaled",
    });


  const url =
    `${BIRDEYE_API}/defi/ohlcv?${params.toString()}`;


  const response =
    await fetch(url, {
      headers: {
        "X-API-KEY":
          apiKey,

        "x-chain":
          "solana",
      },
    });


  if (!response.ok) {
    const text =
      await response.text();

    if (
      response.status === 429
    ) {
      throw new Error(
        "Historical data is temporarily rate limited."
      );
    }

    throw new Error(
      `OHLCV request failed: ${response.status} ${text}`
    );
  }


  const result =
    await response.json();


  console.log(
    "[StockFlow] Birdeye OHLCV response:",
    result
  );


  const items =
    result?.data?.items ||
    result?.data ||
    [];


  if (!Array.isArray(items)) {
    return [];
  }


  return items
    .map((item) => ({
      timestamp:
        Number(
          item?.unixTime ??
            item?.unix_time ??
            item?.timestamp ??
            item?.time
        ) * 1000,

      /*
       * Closing price.
       */
      price:
        Number(
          item?.c ??
            item?.close ??
            item?.closePrice
        ),
    }))
    .filter(
      (item) =>
        Number.isFinite(
          item.timestamp
        ) &&
        Number.isFinite(
          item.price
        ) &&
        item.price > 0
    );
}


/* =========================================================
   HISTORICAL REQUEST MANAGER
========================================================= */

async function requestHistoricalPrices(
  mint,
  timeframe
) {
  try {
    /*
     * First try history_price.
     */
    const historical =
      await fetchHistoricalPriceSeries(
        mint,
        timeframe
      );


    /*
     * If we received usable points,
     * we're done.
     */
    if (
      historical.length > 0
    ) {
      return historical;
    }


    /*
     * History endpoint worked but
     * returned zero usable points.
     */
    console.warn(
      "[StockFlow] Historical price returned 0 points. Trying OHLCV..."
    );


    return await fetchHistoricalOHLCV(
      mint,
      timeframe
    );
  } catch (error) {

    /*
     * Do NOT make another request if
     * Birdeye explicitly rate-limited us.
     */
    if (
      error?.message?.includes(
        "rate limited"
      )
    ) {
      throw error;
    }


    /*
     * Try OHLCV when history_price
     * fails for another reason.
     */
    console.warn(
      "[StockFlow] Historical price failed. Trying OHLCV fallback...",
      error
    );


    return await fetchHistoricalOHLCV(
      mint,
      timeframe
    );
  }
}


/* =========================================================
   PUBLIC HISTORICAL PRICE FUNCTION
========================================================= */

export async function fetchHistoricalPrices(
  mint,
  timeframe = "1D"
) {
  if (!mint) {
    throw new Error(
      "Missing Solana token address"
    );
  }


  const cacheKey =
    getHistoricalCacheKey(
      mint,
      timeframe
    );


  /*
   * 1. Use fresh cached data.
   */
  const cached =
    historicalCache.get(
      cacheKey
    );


  if (
    cached &&
    Date.now() -
      cached.timestamp <
      HISTORICAL_CACHE_DURATION
  ) {
    return cached.data;
  }


  /*
   * 2. Reuse an existing request.
   */
  const existingRequest =
    historicalRequests.get(
      cacheKey
    );


  if (existingRequest) {
    return existingRequest;
  }


  /*
   * 3. Make the request.
   */
  const request =
    requestHistoricalPrices(
      mint,
      timeframe
    )
      .then((data) => {

        /*
         * Cache successful result.
         */
        historicalCache.set(
          cacheKey,
          {
            timestamp:
              Date.now(),

            data,
          }
        );

        return data;
      })
      .finally(() => {

        /*
         * Remove completed request.
         */
        historicalRequests.delete(
          cacheKey
        );
      });


  historicalRequests.set(
    cacheKey,
    request
  );


  return request;
}


/* =========================================================
   COMPLETE STOCK DATA
========================================================= */

export async function getStockData(
  symbol
) {
  /*
   * Get xStocks asset metadata.
   */
  const asset =
    await fetchAsset(
      symbol
    );


  /*
   * Find the Solana deployment.
   */
  const solana =
    getSolanaDeployment(
      asset
    );


  if (!solana) {
    throw new Error(
      `${symbol} does not have a Solana deployment`
    );
  }


  /*
   * Get live Jupiter price.
   */
  const jupiter =
    await fetchJupiterPrice(
      solana.address
    );


  if (!jupiter) {
    throw new Error(
      `No Jupiter price available for ${symbol}`
    );
  }


  const onchainPrice =
    Number(
      jupiter.usdPrice
    );


  /*
   * Reference stock price.
   */
  const referencePrice =
    jupiter.stockData?.price !=
    null
      ? Number(
          jupiter.stockData.price
        )
      : null;


  /*
   * Calculate difference between
   * onchain and reference price.
   */
  let priceDeviation =
    null;


  if (
    referencePrice !== null &&
    referencePrice !== 0
  ) {
    priceDeviation =
      (
        (
          onchainPrice -
          referencePrice
        ) /
        referencePrice
      ) * 100;
  }


  /*
   * Return the complete normalized
   * StockFlow stock object.
   */
  return {
    id:
      asset.id,

    name:
      asset.name,

    symbol:
      asset.symbol,

    underlyingSymbol:
      asset.underlyingSymbol,

    logo:
      asset.logo,

    description:
      asset.description,

    price:
      onchainPrice,

    referencePrice,

    priceChange24h:
      Number(
        jupiter.priceChange24h ||
          0
      ),

    liquidity:
      Number(
        jupiter.liquidity ||
          0
      ),

    decimals:
      Number(
        jupiter.decimals ||
          0
      ),

    priceDeviation,

    marketCap:
      jupiter.stockData?.mcap !=
      null
        ? Number(
            jupiter.stockData.mcap
          )
        : null,


    /*
     * Trading information.
     */
    trading: {
      currency:
        asset.trading?.currency ||
        "USD",

      exchange:
        asset.trading?.exchange
          ?.abbreviation ||
        "N/A",

      exchangeName:
        asset.trading?.exchange
          ?.name ||
        "N/A",

      openNow:
        asset.trading?.openNow ??
        false,

      currentPeriod:
        asset.trading
          ?.currentPeriod ||
        null,

      nextChangeAt:
        asset.trading
          ?.nextChangeAt ||
        null,
    },


    /*
     * Solana information.
     */
    solana: {
      address:
        solana.address,

      supportsAtomicSwaps:
        solana.supportsAtomicSwaps ??
        false,

      stablecoins:
        solana.stablecoins ||
        [],
    },


    /*
     * Jupiter scaled UI config.
     */
    scaledUi:
      jupiter.scaledUiConfig ||
      null,


    /*
     * Last known update.
     */
    updatedAt:
      jupiter.stockData
        ?.updatedAt ||
      null,
  };
}
export async function fetchAssetFromServer(symbol) {
  if (!symbol) {
    throw new Error("Missing asset symbol");
  }

  const response = await fetch(
    `/api/xstocks-asset?symbol=${encodeURIComponent(symbol)}`
  );

  const responseText = await response.text();

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      "Asset proxy returned an invalid response"
    );
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data?.error ||
        "Unable to fetch asset through server"
    );
  }

  return data.asset;
}