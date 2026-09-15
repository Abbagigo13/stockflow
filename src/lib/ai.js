export function analyzeStock(stock) {
  if (!stock) return null;

  const price = Number(stock.price || 0);
  const referencePrice = Number(stock.referencePrice || 0);
  const liquidity = Number(stock.liquidity || 0);
  const change24h = Number(stock.priceChange24h || 0);

  const deviation =
    referencePrice > 0
      ? ((price - referencePrice) / referencePrice) * 100
      : 0;

  /*
   * PRICE INTEGRITY
   *
   * The closer the onchain price is to the reference
   * price, the healthier the alignment.
   */
  const priceIntegrity = Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - Math.abs(deviation) * 15)
    )
  );

  /*
   * LIQUIDITY HEALTH
   */
  let liquidityHealth;

  if (liquidity >= 2_000_000) {
    liquidityHealth = 100;
  } else if (liquidity >= 1_000_000) {
    liquidityHealth = 90;
  } else if (liquidity >= 500_000) {
    liquidityHealth = 75;
  } else if (liquidity >= 250_000) {
    liquidityHealth = 60;
  } else if (liquidity > 0) {
    liquidityHealth = 40;
  } else {
    liquidityHealth = 0;
  }

  /*
   * MOMENTUM
   */
  let sentiment = "NEUTRAL";

  if (change24h >= 2) {
    sentiment = "BULLISH";
  } else if (change24h <= -2) {
    sentiment = "BEARISH";
  }

  /*
   * RISK
   */
  let risk = "MEDIUM";

  if (
    Math.abs(deviation) >= 3 ||
    liquidity < 250_000
  ) {
    risk = "HIGH";
  } else if (
    Math.abs(deviation) < 1 &&
    liquidity >= 1_000_000
  ) {
    risk = "LOW";
  }

  /*
   * MARKET HEALTH
   */
  const marketHealth = Math.round(
    priceIntegrity * 0.55 +
    liquidityHealth * 0.35 +
    Math.max(
      0,
      Math.min(100, 50 + change24h * 10)
    ) * 0.10
  );

  /*
   * CONFIDENCE
   */
  let confidence = 70;

  if (liquidity >= 1_000_000) {
    confidence += 10;
  }

  if (Math.abs(deviation) < 1) {
    confidence += 8;
  }

  if (Math.abs(change24h) > 5) {
    confidence -= 10;
  }

  if (referencePrice <= 0) {
    confidence -= 15;
  }

  confidence = Math.max(
    0,
    Math.min(100, Math.round(confidence))
  );

  /*
   * FINAL AI SCORE
   */
  const score = Math.round(
    marketHealth * 0.50 +
    confidence * 0.25 +
    priceIntegrity * 0.15 +
    liquidityHealth * 0.10
  );

  /*
   * DYNAMIC BULL CASE
   */
  const bullCase = [];

  if (change24h > 0) {
    bullCase.push(
      `Positive short-term momentum of ${change24h.toFixed(2)}% is supporting the asset.`
    );
  } else {
    bullCase.push(
      "The underlying asset remains accessible through the Solana tokenized market."
    );
  }

  if (liquidity >= 1_000_000) {
    bullCase.push(
      `Onchain liquidity is strong at $${(liquidity / 1_000_000).toFixed(2)}M.`
    );
  } else {
    bullCase.push(
      "Additional liquidity could improve execution conditions."
    );
  }

  if (Math.abs(deviation) < 1) {
    bullCase.push(
      "Onchain pricing is closely aligned with the reference market."
    );
  } else {
    bullCase.push(
      "The price difference may create opportunities for market participants monitoring cross-market alignment."
    );
  }

  /*
   * DYNAMIC BEAR CASE
   */
  const bearCase = [];

  if (Math.abs(deviation) >= 1) {
    bearCase.push(
      `The onchain price is ${Math.abs(deviation).toFixed(2)}% away from the reference price.`
    );
  } else {
    bearCase.push(
      "Short-term price divergence remains a possibility as onchain liquidity changes."
    );
  }

  if (change24h < 0) {
    bearCase.push(
      `The asset is experiencing negative 24h momentum of ${change24h.toFixed(2)}%.`
    );
  } else {
    bearCase.push(
      "Market momentum can reverse quickly during volatile periods."
    );
  }

  if (liquidity < 500_000) {
    bearCase.push(
      "Lower liquidity can increase spreads and execution risk."
    );
  } else {
    bearCase.push(
      "Onchain liquidity can still change rapidly with market conditions."
    );
  }

  /*
   * KEY RISKS
   */
  const risks = [
    "Underlying market volatility",
    "Onchain liquidity changes",
  ];

  if (Math.abs(deviation) >= 1) {
    risks.push("Reference-price deviation");
  }

  if (liquidity < 500_000) {
    risks.push("Low liquidity and wider spreads");
  }

  risks.push("Tokenized-asset infrastructure risk");

  /*
   * MARKET BRIEF
   */
  let summary;

  if (sentiment === "BULLISH") {
    summary =
      `${stock.symbol} is showing positive short-term momentum. ` +
      `StockFlow currently rates the market ${score}/100 while monitoring ` +
      `price alignment, liquidity and onchain conditions.`;
  } else if (sentiment === "BEARISH") {
    summary =
      `${stock.symbol} is showing negative short-term momentum. ` +
      `StockFlow currently rates the market ${score}/100 and is monitoring ` +
      `volatility, liquidity and reference-price alignment.`;
  } else {
    summary =
      `${stock.symbol} is showing relatively neutral short-term momentum. ` +
      `StockFlow currently rates the market ${score}/100 while monitoring ` +
      `onchain liquidity and price integrity.`;
  }

  return {
    score,
    sentiment,
    risk,
    confidence,
    marketHealth,
    priceIntegrity,
    liquidityHealth,

    bullCase,
    bearCase,
    risks,

    summary,

    metrics: {
      price,
      referencePrice,
      deviation,
      liquidity,
      change24h,
    },
  };
}