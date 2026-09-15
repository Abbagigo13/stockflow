import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  Brain,
  ChevronRight,
  Circle,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { useStock } from "../hooks/useStock";
import { stocks } from "../data/stocks";

export default function Terminal({
  onNavigate,
  onSelectStock,
}) {
  const [symbol, setSymbol] = useState("NVDAx");
  const [search, setSearch] = useState("");

  const {
    stock,
    loading,
    error,
    refreshing,
  } = useStock(symbol);

  const filteredStocks = stocks.filter((item) => {
    const query = search.toLowerCase();

    return (
      item.symbol.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.underlyingSymbol
        .toLowerCase()
        .includes(query)
    );
  });

  function handleStockClick(nextSymbol) {
    setSymbol(nextSymbol);

    /*
      IMPORTANT:
      This navigates to the separate Stock page.
      The stock information will NOT be rendered
      inside this Terminal page.
    */
    if (onSelectStock) {
      onSelectStock(nextSymbol);
    }
  }

  function formatPrice(value) {
    if (value == null) return "—";

    return `$${Number(value).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatLiquidity(value) {
    if (value == null) return "—";

    const number = Number(value);

    if (number >= 1_000_000) {
      return `$${(
        number / 1_000_000
      ).toFixed(2)}M`;
    }

    if (number >= 1_000) {
      return `$${(
        number / 1_000
      ).toFixed(1)}K`;
    }

    return `$${number.toFixed(2)}`;
  }

  function formatPercent(value) {
    if (value == null) return "—";

    const number = Number(value);

    return `${number >= 0 ? "+" : ""}${number.toFixed(
      2
    )}%`;
  }

  return (
    <div className="terminal-page">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <button
          className="back-button"
          onClick={() =>
            onNavigate?.("landing")
          }
        >
          <ArrowLeft size={16} />
          <span>StockFlow</span>
        </button>

        <div className="sidebar-label">
          MARKET
        </div>

        <button className="side-link active">
          <Activity size={16} />
          Terminal
        </button>

        <button className="side-link">
          <Brain size={16} />
          AI Intelligence
        </button>

        <button className="side-link">
          <ShieldCheck size={16} />
          Onchain
        </button>

        <div className="sidebar-bottom">

          <div className="network-status">
            <Circle
              size={8}
              fill="currentColor"
            />
            <span>Solana Mainnet</span>
          </div>

          <button className="wallet-button">
            <Wallet size={15} />
            Connect Wallet
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="terminal-main">

        {/* HEADER */}

        <header className="terminal-header">

          <div>

            <span className="terminal-label">
              STOCKFLOW TERMINAL
            </span>

            <h1>
              Market intelligence
            </h1>

            <p>
              Analyze tokenized equities,
              liquidity and onchain market
              conditions.
            </p>

          </div>

          <div className="terminal-search">

            <Search size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search assets..."
            />

          </div>

        </header>

        {/* MARKET OVERVIEW */}

        <section className="market-overview">

          <div>
            <span>ASSET</span>
            <strong>
              {stock?.symbol || symbol}
            </strong>
          </div>

          <div>
            <span>PRICE</span>
            <strong>
              {formatPrice(stock?.price)}
            </strong>
          </div>

          <div>
            <span>24H</span>

            <strong
              className={
                Number(
                  stock?.priceChange24h || 0
                ) >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {formatPercent(
                stock?.priceChange24h
              )}
            </strong>
          </div>

          <div>
            <span>LIQUIDITY</span>

            <strong>
              {formatLiquidity(
                stock?.liquidity
              )}
            </strong>
          </div>

          <div>
            <span>MARKET</span>

            <strong>
              {stock?.trading?.openNow
                ? "OPEN"
                : "CLOSED"}
            </strong>
          </div>

        </section>

        {/* TERMINAL CONTENT */}

        <div className="terminal-content">

          {/* WATCHLIST */}

          <section className="stocks-panel">

            <div className="panel-heading">

              <div>
                <span className="section-label">
                  WATCHLIST
                </span>

                <h2>
                  Tokenized equities
                </h2>
              </div>

              <span>
                {filteredStocks.length}
              </span>

            </div>

            <div className="stock-list">

              {filteredStocks.map((item) => (

                <button
                  key={item.symbol}
                  className={`stock-row ${
                    item.symbol === symbol
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleStockClick(
                      item.symbol
                    )
                  }
                >

                  <div className="stock-symbol">

                    <span>
                      {item.symbol}
                    </span>

                    <small>
                      {item.underlyingSymbol}
                    </small>

                  </div>

                  <div className="stock-name">
                    {item.name}
                  </div>

                  <ChevronRight size={15} />

                </button>

              ))}

              {filteredStocks.length === 0 && (
                <div className="empty-state">
                  No assets found.
                </div>
              )}

            </div>

          </section>

          {/* TERMINAL PREVIEW */}

          <section className="analysis-panel">

            <div className="selected-header">

              <div>

                <span className="section-label">
                  LIVE MARKET
                </span>

                <h2>
                  {stock?.name ||
                    "Loading asset..."}
                </h2>

                <p>
                  {stock?.underlyingSymbol ||
                    symbol}
                  {" · "}
                  {stock?.trading?.exchange ||
                    "NASDAQ"}
                </p>

              </div>

              <div className="score-badge">

                <Brain size={15} />

                <span>
                  AI
                </span>

                <strong>
                  ANALYSIS
                </strong>

              </div>

            </div>

            {loading ? (

              <div className="loading-panel">

                <div className="loader-dot" />

                <span>
                  Fetching live Solana
                  market data...
                </span>

              </div>

            ) : error ? (

              <div className="error-panel">

                <strong>
                  Market data unavailable
                </strong>

                <span>
                  {error}
                </span>

              </div>

            ) : (

              <>

                {/* PRICE DISPLAY */}

                <div className="price-display">

                  <div>

                    <span>
                      ONCHAIN PRICE
                    </span>

                    <strong>
                      {formatPrice(
                        stock?.price
                      )}
                    </strong>

                    <em
                      className={
                        Number(
                          stock?.priceChange24h ||
                            0
                        ) >= 0
                          ? "positive"
                          : "negative"
                      }
                    >
                      {formatPercent(
                        stock?.priceChange24h
                      )}
                    </em>

                  </div>

                  <div>

                    <span>
                      REFERENCE
                    </span>

                    <strong>
                      {formatPrice(
                        stock?.referencePrice
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      DEVIATION
                    </span>

                    <strong>
                      {stock?.priceDeviation ==
                      null
                        ? "—"
                        : formatPercent(
                            stock.priceDeviation
                          )}
                    </strong>

                  </div>

                </div>

                {/* SIMPLE MARKET VISUAL */}

                <div className="fake-chart">

                  <div className="chart-header">

                    <span>
                      {symbol} · SOLANA MARKET
                    </span>

                    <span>
                      {refreshing
                        ? "UPDATING"
                        : "LIVE"}
                    </span>

                  </div>

                  <div className="chart-grid" />

                  <div className="terminal-chart-line">
                    ╱╲___╱╲____╱╲___╱╲____╱╲__
                  </div>

                </div>

                {/* METRICS */}

                <div className="intelligence-grid">

                  <div className="metric">

                    <span>
                      MARKET CAP
                    </span>

                    <strong>
                      {stock?.marketCap
                        ? `$${(
                            stock.marketCap /
                            1e12
                          ).toFixed(2)}T`
                        : "—"}
                    </strong>

                  </div>

                  <div className="metric">

                    <span>
                      LIQUIDITY
                    </span>

                    <strong>
                      {formatLiquidity(
                        stock?.liquidity
                      )}
                    </strong>

                  </div>

                  <div className="metric">

                    <span>
                      TOKEN
                    </span>

                    <strong>
                      SPL
                    </strong>

                  </div>

                  <div className="metric">

                    <span>
                      NETWORK
                    </span>

                    <strong>
                      SOLANA
                    </strong>

                  </div>

                </div>

                {/* AI */}

                <div className="ai-analysis">

                  <div className="ai-analysis-header">

                    <div>

                      <span className="section-label">
                        STOCKFLOW AI
                      </span>

                      <h3>
                        Market Intelligence
                      </h3>

                    </div>

                    <div className="ai-status">

                      <span />

                      READY

                    </div>

                  </div>

                  <p className="ai-observation">
                    Select an asset to open its
                    complete StockFlow intelligence
                    profile.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() =>
                      handleStockClick(symbol)
                    }
                  >
                    Open {symbol} analysis
                    <ChevronRight size={16} />
                  </button>

                </div>

              </>

            )}

          </section>

        </div>

      </main>

    </div>
  );
}