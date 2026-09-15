import { useMemo } from "react";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  RefreshCw,
  Wallet,
  LogOut,
} from "lucide-react";

import StockChart from "../components/terminal/StockChart";
import PortfolioCard from "../components/terminal/PortfolioCard";
import Loading from "../components/ui/Loading";

import { useStock } from "../hooks/useStock";
import { useWallet } from "../hooks/useWallet";
import { usePortfolio } from "../hooks/usePortfolio";
import { analyzeStock } from "../lib/ai";

import "./Stock.css";

export default function Stock({
  symbol = "NVDAx",
  onBack,
}) {
  const {
    stock,
    loading,
    refreshing,
    error,
    lastUpdated,
  } = useStock(symbol);

  const {
    address,
    connected,
    connecting,
    error: walletError,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const {
    holdings,
    totalValue,
    loading: portfolioLoading,
    refreshing: portfolioRefreshing,
    error: portfolioError,
    refresh: refreshPortfolio,
  } = usePortfolio(address);

  const analysis = useMemo(
    () => analyzeStock(stock),
    [stock]
  );

  const formatPrice = (value) => {
    if (
      value == null ||
      !Number.isFinite(Number(value))
    ) {
      return "—";
    }

    return `$${Number(value).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatLiquidity = (value) => {
    if (value == null) return "—";

    const number = Number(value);

    if (number >= 1_000_000) {
      return `$${(number / 1_000_000).toFixed(2)}M`;
    }

    if (number >= 1_000) {
      return `$${(number / 1_000).toFixed(1)}K`;
    }

    return `$${number.toFixed(2)}`;
  };

  const formatPercent = (value) => {
    if (value == null) return "—";

    const number = Number(value);

    return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
  };

  const copyAddress = async () => {
    if (!stock?.solana?.address) return;

    try {
      await navigator.clipboard.writeText(
        stock.solana.address
      );
    } catch {
      // Clipboard may be unavailable.
    }
  };

  const copyWalletAddress = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // Clipboard may be unavailable.
    }
  };

  if (loading) {
    return (
      <main className="stock-page">
        <div className="stock-loading">
          <Loading text={`Loading ${symbol}...`} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="stock-page">
        <div className="stock-error">
          <div className="stock-error-code">
            ERROR
          </div>

          <h2>
            Unable to load {symbol}
          </h2>

          <p>{error}</p>

          {onBack && (
            <button
              className="stock-back-button"
              onClick={onBack}
            >
              <ArrowLeft size={16} />
              Back to Terminal
            </button>
          )}
        </div>
      </main>
    );
  }

  if (!stock) {
    return null;
  }

  const score = analysis?.score ?? 0;

  return (
    <main className="stock-page">

      {/* TOP NAVIGATION */}
      <header className="stock-topbar">

        <button
          className="stock-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Terminal
        </button>

        <div className="stock-topbar-right">

          <div className="stock-live">
            <span className="stock-live-dot" />
            LIVE DATA
          </div>

          {refreshing && (
            <div className="stock-refreshing">
              <RefreshCw
                size={13}
                className="refresh-spin"
              />
              Updating
            </div>
          )}

          {lastUpdated && (
            <span className="stock-updated">
              Updated{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

        </div>

      </header>


      {/* STOCK HEADER */}
      <section className="stock-hero">

        <div className="stock-identity">

          <div className="stock-logo">
            {stock.logo ? (
              <img
                src={stock.logo}
                alt=""
              />
            ) : (
              stock.symbol
                ?.replace("x", "")
                .slice(0, 2)
            )}
          </div>

          <div>

            <div className="stock-symbol">
              {stock.symbol}
            </div>

            <h1>
              {stock.name}
            </h1>

            <div className="stock-meta">
              {stock.underlyingSymbol}
              <span>·</span>
              {stock.trading?.exchange ||
                "NASDAQ"}
              <span>·</span>
              Tokenized equity
            </div>

          </div>

        </div>

        <div className="stock-hero-price">

          <span className="label">
            ONCHAIN PRICE
          </span>

          <strong>
            {formatPrice(stock.price)}
          </strong>

          <span
            className={
              Number(stock.priceChange24h) >= 0
                ? "change positive"
                : "change negative"
            }
          >
            {formatPercent(
              stock.priceChange24h
            )}

            <small>24h</small>
          </span>

        </div>

      </section>


      {/* MARKET STATUS */}
      <section className="stock-status-row">

        <div className="status-box">
          <span>MARKET</span>

          <strong>
            {stock.trading?.openNow
              ? "OPEN"
              : "CLOSED"}
          </strong>
        </div>

        <div className="status-box">
          <span>REFERENCE</span>

          <strong>
            {formatPrice(
              stock.referencePrice
            )}
          </strong>
        </div>

        <div className="status-box">
          <span>DEVIATION</span>

          <strong
            className={
              Number(
                stock.priceDeviation || 0
              ) >= 0
                ? "positive"
                : "negative"
            }
          >
            {stock.priceDeviation == null
              ? "—"
              : `${
                  stock.priceDeviation >= 0
                    ? "+"
                    : ""
                }${Number(
                  stock.priceDeviation
                ).toFixed(2)}%`}
          </strong>
        </div>

        <div className="status-box">
          <span>LIQUIDITY</span>

          <strong>
            {formatLiquidity(
              stock.liquidity
            )}
          </strong>
        </div>

      </section>


      {/* MAIN CONTENT */}
      <section className="stock-main-grid">

        {/* LEFT */}
        <div className="stock-main-column">

          {/* CHART */}
          <div className="stock-card chart-card">

            <div className="stock-card-header">

              <div>
                <span className="section-label">
                  PRICE HISTORY
                </span>

                <h2>
                  {stock.symbol} on Solana
                </h2>
              </div>

              <div className="chart-live">
                <span />
                Streaming
              </div>

            </div>

            <StockChart stock={stock} />

          </div>


          {/* AI ANALYSIS */}
          <div className="stock-card">

            <div className="stock-card-header">

              <div>
                <span className="section-label">
                  STOCKFLOW AI
                </span>

                <h2>
                  Market Analyst
                </h2>
              </div>

              <div className="ai-tag">
                AI
              </div>

            </div>

            <div className="ai-overview">

              <div className="ai-score">

                <div className="ai-score-ring">

                  <strong>
                    {score}
                  </strong>

                  <span>
                    /100
                  </span>

                </div>

              </div>

              <div className="ai-summary">

                <div className="ai-summary-row">
                  <span>
                    Sentiment
                  </span>

                  <strong
                    className={
                      analysis?.sentiment ===
                      "bullish"
                        ? "positive"
                        : analysis?.sentiment ===
                            "bearish"
                          ? "negative"
                          : ""
                    }
                  >
                    {analysis?.sentiment?.toUpperCase() ||
                      "NEUTRAL"}
                  </strong>
                </div>

                <div className="ai-summary-row">
                  <span>Risk</span>

                  <strong>
                    {analysis?.risk?.toUpperCase() ||
                      "MEDIUM"}
                  </strong>
                </div>

                <div className="ai-summary-row">
                  <span>
                    Confidence
                  </span>

                  <strong>
                    {analysis?.confidence ??
                      0}
                    %
                  </strong>
                </div>

              </div>

            </div>

            <div className="ai-observation">

              <span className="section-label">
                AI OBSERVATION
              </span>

              <p>
                {analysis?.summary}
              </p>

            </div>

            <div className="thesis-grid">

              <div className="thesis-card">

                <span className="thesis-title positive">
                  BULL CASE
                </span>

                <ul>
                  {analysis?.bullCase?.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>

              <div className="thesis-card">

                <span className="thesis-title negative">
                  BEAR CASE
                </span>

                <ul>
                  {analysis?.bearCase?.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>

            </div>

            <div className="risk-list">

              <span className="section-label">
                KEY RISKS
              </span>

              <div>
                {analysis?.risks?.map(
                  (risk, index) => (
                    <span key={index}>
                      {risk}
                    </span>
                  )
                )}
              </div>

            </div>

            <div className="ai-disclaimer">
              StockFlow AI provides market
              analysis for informational
              purposes only. This is not
              financial advice.
            </div>

          </div>

        </div>


        {/* RIGHT SIDEBAR */}
        <aside className="stock-sidebar">

          {/* AI SCORE */}
          <div className="stock-card score-card">

            <span className="section-label">
              AI MARKET SCORE
            </span>

            <div className="big-score">
              {score}
              <small>/100</small>
            </div>

            <div className="score-bar">
              <div
                style={{
                  width: `${score}%`,
                }}
              />
            </div>

            <p>
              Composite assessment of market
              health, price integrity and
              onchain liquidity.
            </p>

          </div>


          {/* MARKET HEALTH */}
          <div className="stock-card">

            <div className="stock-card-header">

              <div>
                <span className="section-label">
                  MARKET HEALTH
                </span>

                <h3>
                  Onchain integrity
                </h3>
              </div>

            </div>

            <HealthMetric
              label="Market Health"
              value={analysis?.marketHealth}
            />

            <HealthMetric
              label="Price Integrity"
              value={analysis?.priceIntegrity}
            />

            <HealthMetric
              label="Liquidity Health"
              value={analysis?.liquidityHealth}
            />

            <HealthMetric
              label="AI Confidence"
              value={analysis?.confidence}
            />

          </div>


          {/* ONCHAIN */}
          <div className="stock-card">

            <div className="stock-card-header">

              <div>
                <span className="section-label">
                  ONCHAIN
                </span>

                <h3>
                  Solana Asset
                </h3>
              </div>

              <div className="solana-pill">
                SOLANA
              </div>

            </div>

            <div className="onchain-detail">

              <span>
                Token Address
              </span>

              <div className="address-row">

                <code>
                  {stock.solana?.address}
                </code>

                <button
                  onClick={copyAddress}
                  title="Copy address"
                >
                  <Copy size={14} />
                </button>

              </div>

            </div>

            <div className="onchain-detail-row">

              <div>
                <span>
                  Atomic Swaps
                </span>

                <strong>
                  {stock.solana
                    ?.supportsAtomicSwaps
                    ? "Supported"
                    : "Unavailable"}
                </strong>
              </div>

              <div>
                <span>
                  Stablecoin
                </span>

                <strong>
                  {stock.solana
                    ?.stablecoins?.[0]
                    ?.symbol || "USDC"}
                </strong>
              </div>

            </div>

            <a
              className="solana-link"
              href={`https://solscan.io/token/${stock.solana?.address}`}
              target="_blank"
              rel="noreferrer"
            >
              View on Solscan
              <ExternalLink size={14} />
            </a>

          </div>


          {/* PORTFOLIO */}
          <PortfolioCard
            address={address}
            holdings={holdings}
            totalValue={totalValue}
            loading={portfolioLoading}
            refreshing={portfolioRefreshing}
            error={portfolioError}
            onRefresh={refreshPortfolio}
          />


          {/* WALLET */}
          <div className="stock-card wallet-card">

            <div className="stock-card-header">

              <div>
                <span className="section-label">
                  SOLANA WALLET
                </span>

                <h3>
                  Wallet connection
                </h3>
              </div>

              <div
                className={
                  connected
                    ? "wallet-status connected"
                    : "wallet-status"
                }
              >
                <span />
                {connected
                  ? "CONNECTED"
                  : "NOT CONNECTED"}
              </div>

            </div>

            {!connected || !address ? (
              <>

                <div className="wallet-icon">
                  <Wallet size={22} />
                </div>

                <p>
                  Connect your Solana wallet
                  to analyze your tokenized
                  stock positions.
                </p>

                {walletError && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      borderRadius: "8px",
                      border:
                        "1px solid rgba(244,63,94,0.25)",
                      background:
                        "rgba(244,63,94,0.08)",
                      color: "#fb7185",
                      fontSize: "11px",
                      lineHeight: 1.5,
                    }}
                  >
                    {walletError}
                  </div>
                )}

                <button
                  className="connect-wallet-button"
                  onClick={connectWallet}
                  disabled={connecting}
                >
                  <Wallet size={15} />

                  {connecting
                    ? "Connecting..."
                    : "Connect Wallet"}
                </button>

              </>
            ) : (
              <>

                <div
                  className="wallet-connected-box"
                >

                  <div className="wallet-connected-icon">
                    <Wallet size={17} />
                  </div>

                  <div>
                    <span>
                      Connected wallet
                    </span>

                    <button
                      onClick={
                        copyWalletAddress
                      }
                      title="Copy wallet address"
                    >
                      <code>
                        {address.slice(0, 6)}
                        ...
                        {address.slice(-6)}
                      </code>

                      <Copy size={13} />
                    </button>
                  </div>

                </div>

                <button
                  className="disconnect-wallet-button"
                  onClick={disconnectWallet}
                >
                  <LogOut size={14} />
                  Disconnect Wallet
                </button>

              </>
            )}

          </div>

        </aside>

      </section>


      {/* DISCLAIMER */}
      <footer className="stock-footer">

        <span>
          StockFlow AI · Market intelligence
          for tokenized equities on Solana
        </span>

        <span>
          Informational purposes only · Not
          financial advice
        </span>

      </footer>

    </main>
  );
}


function HealthMetric({
  label,
  value = 0,
}) {
  const safeValue = Math.max(
    0,
    Math.min(
      100,
      Number(value) || 0
    )
  );

  return (
    <div className="health-metric">

      <div className="health-top">

        <span>
          {label}
        </span>

        <strong>
          {safeValue}%
        </strong>

      </div>

      <div className="health-bar">

        <div
          style={{
            width: `${safeValue}%`,
          }}
        />

      </div>

    </div>
  );
}