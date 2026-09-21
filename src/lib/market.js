

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

/*
 * Browsers cannot call api.xstocks.fi directly (the browser
 * blocks it with a CORS error), so asset data is loaded
 * through our own server function at /api/xstocks-asset.
 */
export async function fetchAsset(symbol) {
  return fetchAssetFromServer(symbol);
}


/* =========================================================
   JUPITER
========================================================= */

/*
 * Price requests made within a short moment of each other are
 * merged into ONE request to /api/jupiter-price, because Jupiter
 * rate limits many separate calls. The server keeps a short cache.
 */
let priceBatch = null;

function getPriceBatch() {
  if (!priceBatch) {
    const batch = { mints: new Set(), waiters: [] };

    priceBatch = batch;

    setTimeout(() => {
      if (priceBatch === batch) {
        priceBatch = null;
      }

      flushPriceBatch(batch);
    }, 120);
  }

  return priceBatch;
}

async function flushPriceBatch(batch) {
  try {
    const response = await fetch(
      `/api/jupiter-price?ids=${encodeURIComponent(
        [...batch.mints].join(",")
      )}`
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        "Price proxy returned an invalid response"
      );
    }

    if (response.status === 429) {
      throw new Error(
        "Jupiter price data is temporarily rate limited."
      );
    }

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.error || "Jupiter price request failed"
      );
    }

    batch.waiters.forEach(({ mint, resolve }) =>
      resolve(data[mint] || null)
    );
  } catch (error) {
    batch.waiters.forEach(({ reject }) => reject(error));
  }
}

export function fetchJupiterPrice(mint) {
  return new Promise((resolve, reject) => {
    const batch = getPriceBatch();

    batch.mints.add(mint);
    batch.waiters.push({ mint, resolve, reject });
  });
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
 *
 * NOTE: when the request uses ui_amount_mode=scaled,
 * Birdeye names each price "scaledValue" instead of
 * "value", so scaledValue is checked first.
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
   *       unixTime: 1234567890,
   *       scaledValue: 218.50
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
            item?.scaledValue ??
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
            item?.scaledValue ??
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
   HISTORICAL PRICE REQUEST (through our own server)
========================================================= */

/*
 * The Birdeye API key now lives on the server. The browser asks
 * /api/price-history, and that function calls Birdeye for us.
 */
async function requestHistoricalPrices(
  mint,
  timeframe
) {
  const params = new URLSearchParams({
    mint,
    timeframe,
  });

  const response = await fetch(
    `/api/price-history?${params.toString()}`
  );

  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      "Price history proxy returned an invalid response"
    );
  }

  if (response.status === 429) {
    throw new Error(
      "Historical data is temporarily rate limited."
    );
  }

  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.error ||
        "Unable to load price history"
    );
  }

  return normalizeHistoricalData(result);
}

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