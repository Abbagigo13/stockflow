import { motion } from "framer-motion";
import {
  Brain,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  Target,
  Droplets,
  Gauge,
} from "lucide-react";

export default function AIAnalyst({ analysis, stock }) {
  if (!analysis || !stock) {
    return (
      <div className="ai-analysis">
        <div className="ai-analysis-header">
          <div>
            <span className="section-label">
              STOCKFLOW AI
            </span>

            <h3>Market Analyst</h3>
          </div>

          <Brain size={22} />
        </div>

        <p className="ai-empty">
          Waiting for market data...
        </p>
      </div>
    );
  }

  const sentiment = (
    analysis.sentiment || "neutral"
  ).toLowerCase();

  const risk = (
    analysis.risk || "medium"
  ).toLowerCase();

  const sentimentLabel =
    sentiment === "bullish"
      ? "BULLISH"
      : sentiment === "bearish"
        ? "BEARISH"
        : "NEUTRAL";

  const SentimentIcon =
    sentiment === "bullish"
      ? TrendingUp
      : sentiment === "bearish"
        ? TrendingDown
        : Activity;

  const score = Math.max(
    0,
    Math.min(100, Number(analysis.score || 0))
  );

  const confidence = Math.max(
    0,
    Math.min(100, Number(analysis.confidence || 0))
  );

  const marketHealth = Math.max(
    0,
    Math.min(100, Number(analysis.marketHealth || 0))
  );

  const priceIntegrity = Math.max(
    0,
    Math.min(100, Number(analysis.priceIntegrity || 0))
  );

  const liquidityHealth = Math.max(
    0,
    Math.min(100, Number(analysis.liquidityHealth || 0))
  );

  const metrics = analysis.metrics || {};

  const price = Number(metrics.price || stock.price || 0);

  const deviation = Number(
    metrics.deviation ??
      stock.priceDeviation ??
      0
  );

  const liquidity = Number(
    metrics.liquidity ||
      stock.liquidity ||
      0
  );

  const change24h = Number(
    metrics.change24h ??
      stock.priceChange24h ??
      0
  );

  function formatUsd(value) {
    if (!Number.isFinite(value) || value <= 0) {
      return "N/A";
    }

    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }

    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }

    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    }

    return `$${value.toFixed(2)}`;
  }

  function getMetricColor(value) {
    if (value >= 75) return "positive";
    if (value >= 50) return "neutral";
    return "negative";
  }

  return (
    <div className="ai-analysis">

      {/* HEADER */}
      <div className="ai-analysis-header">
        <div>
          <div className="ai-title-row">
            <Sparkles size={15} />

            <span className="section-label">
              STOCKFLOW AI
            </span>
          </div>

          <h3>Market Analyst</h3>

          <p className="text-xs text-zinc-500 mt-1">
            Real-time intelligence for{" "}
            <span className="text-zinc-300 font-medium">
              {stock.symbol}
            </span>
          </p>
        </div>

        <div className="ai-brain">
          <Brain size={20} />
        </div>
      </div>

      {/* SCORE / SENTIMENT / RISK */}
      <div className="ai-score-row">

        <div>
          <span className="metric-label">
            AI SCORE
          </span>

          <motion.div
            className="ai-big-score"
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.4,
            }}
          >
            {score}
            <span>/100</span>
          </motion.div>
        </div>

        <div className="ai-sentiment">
          <SentimentIcon size={18} />

          <div>
            <span className="metric-label">
              SENTIMENT
            </span>

            <strong
              className={`sentiment-${sentiment}`}
            >
              {sentimentLabel}
            </strong>
          </div>
        </div>

        <div className="ai-risk">
          <ShieldAlert size={18} />

          <div>
            <span className="metric-label">
              RISK
            </span>

            <strong>
              {risk.toUpperCase()}
            </strong>
          </div>
        </div>

      </div>

      {/* CORE METRICS */}
      <div className="ai-metrics">

        <div>
          <span>CONFIDENCE</span>

          <strong>{confidence}%</strong>

          <div className="ai-progress">
            <div
              style={{
                width: `${confidence}%`,
              }}
            />
          </div>
        </div>

        <div>
          <span>MARKET HEALTH</span>

          <strong>{marketHealth}%</strong>

          <div className="ai-progress">
            <div
              style={{
                width: `${marketHealth}%`,
              }}
            />
          </div>
        </div>

        <div>
          <span>PRICE INTEGRITY</span>

          <strong>{priceIntegrity}%</strong>

          <div className="ai-progress">
            <div
              style={{
                width: `${priceIntegrity}%`,
              }}
            />
          </div>
        </div>

        <div>
          <span>LIQUIDITY HEALTH</span>

          <strong>{liquidityHealth}%</strong>

          <div className="ai-progress">
            <div
              style={{
                width: `${liquidityHealth}%`,
              }}
            />
          </div>
        </div>

      </div>

      {/* MARKET SNAPSHOT */}
      <div className="ai-summary">

        <div className="ai-title-row">
          <Activity size={14} />

          <span className="section-label">
            MARKET SNAPSHOT
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "10px",
            marginTop: "14px",
          }}
        >

          <div className="metric">
            <span className="metric-label">
              PRICE
            </span>

            <strong>
              {price > 0
                ? `$${price.toFixed(2)}`
                : "N/A"}
            </strong>
          </div>

          <div className="metric">
            <span className="metric-label">
              24H
            </span>

            <strong
              className={
                change24h >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {change24h >= 0 ? "+" : ""}
              {change24h.toFixed(2)}%
            </strong>
          </div>

          <div className="metric">
            <span className="metric-label">
              DEVIATION
            </span>

            <strong
              className={getMetricColor(
                priceIntegrity
              )}
            >
              {deviation >= 0 ? "+" : ""}
              {deviation.toFixed(2)}%
            </strong>
          </div>

          <div className="metric">
            <span className="metric-label">
              LIQUIDITY
            </span>

            <strong>
              {formatUsd(liquidity)}
            </strong>
          </div>

        </div>
      </div>

      {/* AI OBSERVATION */}
      <div className="ai-summary">

        <span className="section-label">
          AI OBSERVATION
        </span>

        <p>
          {analysis.summary ||
            `StockFlow is monitoring ${stock.symbol} across price, liquidity and onchain market conditions.`}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "14px",
          }}
        >
          <span className="ai-data-tag">
            <Target size={11} />
            {stock.symbol}
          </span>

          <span className="ai-data-tag">
            <Gauge size={11} />
            {marketHealth}% health
          </span>

          <span className="ai-data-tag">
            <Droplets size={11} />
            {formatUsd(liquidity)} liquidity
          </span>
        </div>
      </div>

      {/* BULL / BEAR */}
      <div className="thesis-grid">

        <div>
          <div className="thesis-title bullish-title">
            <TrendingUp size={15} />
            BULL CASE
          </div>

          <ul>
            {(analysis.bullCase || []).map(
              (item, index) => (
                <li key={index}>
                  {item}
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <div className="thesis-title bearish-title">
            <TrendingDown size={15} />
            BEAR CASE
          </div>

          <ul>
            {(analysis.bearCase || []).map(
              (item, index) => (
                <li key={index}>
                  {item}
                </li>
              )
            )}
          </ul>
        </div>

      </div>

      {/* KEY RISKS */}
      <div className="ai-risks">

        <span className="section-label">
          KEY RISKS
        </span>

        <div className="risk-list">
          {(analysis.risks || []).map(
            (riskItem, index) => (
              <span key={index}>
                {riskItem}
              </span>
            )
          )}
        </div>

      </div>

      {/* DISCLAIMER */}
      <div className="ai-disclaimer">
        StockFlow AI provides market analysis based
        on available market and onchain data. It does
        not constitute financial advice.
      </div>

    </div>
  );
}