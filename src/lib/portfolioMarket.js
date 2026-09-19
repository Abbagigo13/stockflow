import { getStockData } from "./market.js";
import { stocks } from "../data/stocks.js";

export async function getPortfolioMarketData() {
  const results = await Promise.all(
    stocks.map(async (asset) => {
      try {
        const data = await getStockData(asset.symbol);

        return {
          symbol: data.symbol,
          name: data.name,
          underlyingSymbol: data.underlyingSymbol,
          category: asset.category,

          price: data.price,
          priceChange24h: data.priceChange24h,
          referencePrice: data.referencePrice,
          priceDeviation: data.priceDeviation,

          liquidity: data.liquidity,
          marketCap: data.marketCap,

          marketHealth:
            data.marketHealth ?? null,

          priceIntegrity:
            data.priceIntegrity ?? null,

          liquidityHealth:
            data.liquidityHealth ?? null,

          trading: data.trading
            ? {
                openNow: data.trading.openNow,
                exchange: data.trading.exchange,
              }
            : null,
        };
      } catch (error) {
        console.error(
          `Failed to load ${asset.symbol}:`,
          error
        );

        return {
          symbol: asset.symbol,
          name: asset.name,
          underlyingSymbol:
            asset.underlyingSymbol,
          category: asset.category,
          error: "Market data unavailable",
        };
      }
    })
  );

  return results;
}
