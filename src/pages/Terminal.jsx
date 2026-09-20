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

import StockChart from "../components/terminal/StockChart";
import { useStock } from "../hooks/useStock";
import { stocks } from "../data/stocks";

export default function Terminal({
  onNavigate,
  onSelectStock,
  address,
  connected,
  connecting,
  walletError,
  onConnect,
  onDisconnect,
}) {
  const [symbol, setSymbol] = useState("NVDAx");
  const [search, setSearch] = useState("");

  const {
    stock: loadedStock,
    loading,
    error,
    refreshing,
  } = useStock(symbol);

  /*
   * While a new asset is loading (or failed), don't show the
   * previous asset's numbers. The boxes show dashes instead.
   */
  const stock = loading || error ? null : loadedStock;

  const selectedItem = stocks.find(
    (item) => item.symbol === symbol
  );

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

  // Clicking a watchlist row previews the asset here.
  function handleSelect(nextSymbol) {
    setSymbol(nextSymbol);
  }

  // The full analysis page opens from the preview.
  function handleOpenAnalysis() {
    if (onSelectStock) {
      onSelectStock(symbol);
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

  function formatWallet(address) {
    if (!address) return "Connect Wallet";

    return `${address.slice(
      0,
      6
    )}...${address.slice(-6)}`;
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

        <button
          className="side-link active"
          onClick={() =>
            onNavigate?.("terminal")
          }
        >
          <Activity size={16} />
          Terminal
        </button>

        <button
          className="side-link"
          onClick={() =>
            onNavigate?.("portfolio")
          }
        >
          <Brain size={16} />
          AI Portfolio
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

          {connected ? (
            <button
              className="wallet-button"
              onClick={onDisconnect}
              title="Disconnect wallet"
            >
              <Wallet size={15} />
              {formatWallet(address)}
            </button>
          ) : (
            <button
              className="wallet-button"
              onClick={onConnect}
              disabled={connecting}
            >
              <Wallet size={15} />

              {connecting
                ? "Connecting..."
                : "Connect Wallet"}
            </button>
          )}

          {walletError && (
            <div className="wallet-error">
              {walletError}
            </div>
          )}

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

            <p
              style={{
                fontSize: "12px",
                opacity: 0.6,
                margin: "4px 0 12px",
                lineHeight: 1.5,
              }}
            >
              Select an asset to preview it.
              Open the full analysis from the
              preview.
            </p>

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
                    handleSelect(
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
                    selectedItem?.name ||
                    "Loading asset..."}
                </h2>

                <p>
                  {stock?.underlyingSymbol ||
                    selectedItem?.underlyingSymbol ||
                    symbol}
                  {" · "}
                  {stock?.trading?.exchange ||
                    "NASDAQ"}
                </p>

              </div>

              <div
                className="score-badge"
                role="button"
                tabIndex={0}
                title="Open full analysis"
                aria-label={`Open ${symbol} full analysis`}
                style={{ cursor: "pointer" }}
                onClick={handleOpenAnalysis}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    handleOpenAnalysis();
                  }
                }}
              >

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

                {/* PRICE CHART (real Birdeye data) */}

                <div style={{ margin: "24px 0" }}>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      opacity: 0.7,
                    }}
                  >
                    <span>
                      {symbol} · SOLANA MARKET
                    </span>

                    <span>
                      {refreshing
                        ? "UPDATING"
                        : "LIVE"}
                    </span>
                  </div>

                  <StockChart
                    stock={stock}
                    height={300}
                  />

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
                    Open the complete StockFlow
                    intelligence profile for{" "}
                    {symbol}: AI score, bull and
                    bear cases, key risks and
                    onchain details.
                  </p>

                  <button
                    className="primary-button"
                    onClick={handleOpenAnalysis}
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