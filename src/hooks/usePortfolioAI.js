import { useState } from "react";

import { generatePortfolio } from "../lib/portfolioAI";
import { getPortfolioMarketData } from "../lib/portfolioMarket";

export function usePortfolioAI() {
  const [portfolio, setPortfolio] =
    useState(null);

  const [marketData, setMarketData] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  async function generate({
    amount,
    riskProfile,
    goals = [],
  }) {
    try {
      setLoading(true);
      setError(null);
      setPortfolio(null);

      // Get fresh market data before asking Qwen.
      const freshMarketData =
        await getPortfolioMarketData();

      setMarketData(freshMarketData);

      // Ask Qwen to construct the portfolio.
      const result =
        await generatePortfolio({
          amount,
          riskProfile,
          goals,
          marketData: freshMarketData,
        });

      setPortfolio(result);

      return result;
    } catch (err) {
      console.error(
        "Portfolio AI error:",
        err
      );

      const message =
        err?.message ||
        "Failed to generate AI portfolio.";

      setError(message);

      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPortfolio(null);
    setMarketData([]);
    setError(null);
  }

  return {
    portfolio,
    marketData,
    loading,
    error,
    generate,
    reset,
  };
}
