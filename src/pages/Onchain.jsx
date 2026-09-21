import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Brain,
  Circle,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import PortfolioCard from "../components/terminal/PortfolioCard";
import { usePortfolio } from "../hooks/usePortfolio";
import { stocks } from "../data/stocks";
import { getStockData } from "../lib/market";
import { clearActivity, getActivity } from "../lib/activity";
import {
  MAINNET_EXECUTION_ENABLED,
  devnetExplorerTxUrl,
} from "../lib/solanaNetworks";

import "./Onchain.css";

/*
 * Loads all tracked stocks in small batches so the free
 * data plans are not hit with every request at once.
 * One failed asset never breaks the others.
 */
async function loadAssets() {
  const rows = [];

  for (let start = 0; start < stocks.length; start += 5) {
    const chunk = stocks.slice(start, start + 5);

    const settled = await Promise.allSettled(
      chunk.map((item) => getStockData(item.symbol))
    );

    settled.forEach((result, index) => {
      rows.push({
        item: chunk[index],
        stock:
          result.status === "fulfilled" ? result.value : null,
        error:
          result.status === "rejected"
            ? result.reason?.message || "Failed to load"
            : "",
      });
    });
  }

  return rows;
}

function formatPrice(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "—";
  }

  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatLiquidity(value) {
  if (value == null) return "—";

  const number = Number(value);

  if (number >= 1_000_000) {
    return `$${(number / 1_000_000).toFixed(2)}M`;
  }

  if (number >= 1_000) {
    return `$${(number / 1_000).toFixed(1)}K`;
  }

  return `$${number.toFixed(2)}`;
}

function formatPercent(value) {
  if (value == null) return "—";

  const number = Number(value);

  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function shortAddress(value) {
  if (!value) return "—";

  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function explorerUrl(entry) {
  if (entry.network === "devnet") {
    return devnetExplorerTxUrl(entry.signature);
  }

  return `https://solscan.io/tx/${entry.signature}`;
}

export default function Onchain({
  onNavigate,
  onSelectStock,
  address,
  connected,
  connecting,
  walletError,
  onConnect,
  onDisconnect,
}) {
  // null means "loading".
  const [assets, setAssets] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activity, setActivity] = useState(() => getActivity());
  const [copied, setCopied] = useState("");

  const {
    holdings,
    totalValue,
    loading: portfolioLoading,
    refreshing: portfolioRefreshing,
    error: portfolioError,
    refresh: refreshPortfolio,
  } = usePortfolio(address);

  useEffect(() => {
    let cancelled = false;

    loadAssets().then((rows) => {
      if (!cancelled) {
        setAssets(rows);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function handleRefresh() {
    setAssets(null);
    setReloadKey((count) => count + 1);
  }

  function handleClearActivity() {
    clearActivity();
    setActivity([]);
  }

  async function copyText(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // Clipboard may be unavailable.
    }
  }

  const loadedRows = assets
    ? assets.filter((row) => row.stock)
    : [];

  const totalLiquidity = loadedRows.reduce(
    (sum, row) => sum + Number(row.stock.liquidity || 0),
    0
  );

  const widest = loadedRows.reduce((best, row) => {
    const deviation = row.stock.priceDeviation;

    if (deviation == null) return best;

    if (!best || Math.abs(deviation) > Math.abs(best.deviation)) {
      return { deviation, symbol: row.item.symbol };
    }

    return best;
  }, null);

  return (
    <div className="terminal-page">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <button
          className="back-button"
          onClick={() => onNavigate?.("landing")}
        >
          <ArrowLeft size={16} />
          <span>StockFlow</span>
        </button>

        <div className="sidebar-label">
          MARKET
        </div>

        <button
          className="side-link"
          onClick={() => onNavigate?.("terminal")}
        >
          <Activity size={16} />
          Terminal
        </button>

        <button
          className="side-link"
          onClick={() => onNavigate?.("portfolio")}
        >
          <Brain size={16} />
          AI Portfolio
        </button>

        <button
          className="side-link active"
          onClick={() => onNavigate?.("onchain")}
        >
          <ShieldCheck size={16} />
          Onchain
        </button>

        <div className="sidebar-bottom">

          <div className="network-status">
            <Circle size={8} fill="currentColor" />
            <span>Solana Mainnet</span>
          </div>

          {connected ? (
            <button
              className="wallet-button"
              onClick={onDisconnect}
              title="Disconnect wallet"
            >
              <Wallet size={15} />
              {shortAddress(address)}
            </button>
          ) : (
            <button
              className="wallet-button"
              onClick={onConnect}
              disabled={connecting}
            >
              <Wallet size={15} />
              {connecting ? "Connecting..." : "Connect Wallet"}
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

        <header className="terminal-header">

          <div>

            <span className="terminal-label">
              STOCKFLOW ONCHAIN
            </span>

            <h1>
              Onchain overview
            </h1>

            <p>
              Your wallet, network mode, transaction activity
              and the tokenized stocks StockFlow tracks on
              Solana.
            </p>

          </div>

        </header>

        <div className="onc-body">

          {/* STATUS */}

          <section className="onc-status-grid">

            <div className="onc-card">
              <span className="onc-label">WALLET</span>

              {connected && address ? (
                <>
                  <strong className="onc-value">
                    {shortAddress(address)}
                  </strong>

                  <div className="onc-row-actions">
                    <button
                      className="onc-btn"
                      onClick={() => copyText(address, "wallet")}
                    >
                      <Copy size={13} />
                      {copied === "wallet"
                        ? "Copied"
                        : "Copy address"}
                    </button>

                    <button
                      className="onc-btn"
                      onClick={onDisconnect}
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <strong className="onc-value">
                    Not connected
                  </strong>

                  <p className="onc-muted">
                    Connect Phantom to see your positions and
                    activity.
                  </p>

                  <div className="onc-row-actions">
                    <button
                      className="onc-btn onc-btn-primary"
                      onClick={onConnect}
                      disabled={connecting}
                    >
                      {connecting
                        ? "Connecting..."
                        : "Connect wallet"}
                    </button>
                  </div>
                </>
              )}

              {walletError && (
                <p className="onc-error">{walletError}</p>
              )}
            </div>

            <div className="onc-card">
              <span className="onc-label">NETWORKS</span>

              <ul className="onc-list">
                <li>
                  <span className="onc-dot ok" />
                  <strong>Mainnet</strong> live market data and
                  swap quotes
                </li>

                <li>
                  <span className="onc-dot warn" />
                  <strong>Devnet</strong> wallet test
                  transactions with free test SOL
                </li>
              </ul>
            </div>

            <div className="onc-card">
              <span className="onc-label">
                MAINNET EXECUTION
              </span>

              <strong
                className={`onc-value ${
                  MAINNET_EXECUTION_ENABLED ? "warn" : "ok"
                }`}
              >
                {MAINNET_EXECUTION_ENABLED
                  ? "Enabled"
                  : "Disabled"}
              </strong>

              <p className="onc-muted">
                StockFlow never holds your keys. Every
                transaction is signed in your own wallet.
              </p>
            </div>

          </section>

          {/* ACTIVITY + POSITIONS */}

          <section className="onc-two-col">

            <div className="onc-card">

              <div className="onc-card-head">
                <div>
                  <span className="onc-label">ACTIVITY</span>
                  <h3>StockFlow transactions</h3>
                </div>

                {activity.length > 0 && (
                  <button
                    className="onc-btn"
                    onClick={handleClearActivity}
                  >
                    Clear
                  </button>
                )}
              </div>

              {activity.length === 0 ? (
                <p className="onc-muted">
                  No transactions yet. Open AI Portfolio,
                  generate a portfolio, and run the Devnet
                  test in the review steps. It will appear
                  here.
                </p>
              ) : (
                <ul className="onc-activity">
                  {activity.map((entry) => (
                    <li key={`${entry.signature}-${entry.at}`}>
                      <div>
                        <strong>
                          {entry.kind}
                          <span className="onc-net">
                            {entry.network === "devnet"
                              ? "DEVNET"
                              : "MAINNET"}
                          </span>
                        </strong>

                        <span>
                          {new Date(entry.at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {shortAddress(entry.signature)}
                        </span>
                      </div>

                      <a
                        href={explorerUrl(entry)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Explorer
                        <ExternalLink size={12} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              <p className="onc-muted small">
                Saved in this browser only.
              </p>

            </div>

            <div className="onc-positions">
              <PortfolioCard
                address={address}
                holdings={holdings}
                totalValue={totalValue}
                loading={portfolioLoading}
                refreshing={portfolioRefreshing}
                error={portfolioError}
                onRefresh={refreshPortfolio}
              />
            </div>

          </section>

          {/* ASSETS */}

          <section className="onc-card">

            <div className="onc-card-head">
              <div>
                <span className="onc-label">
                  TOKENIZED ASSETS
                </span>
                <h3>Tracked xStocks on Solana</h3>
              </div>

              <button
                className="onc-btn"
                onClick={handleRefresh}
                disabled={assets === null}
              >
                <RefreshCw
                  size={13}
                  className={assets === null ? "refresh-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="onc-chips">
              <div>
                <span>ASSETS LOADED</span>
                <strong>
                  {assets
                    ? `${loadedRows.length} / ${stocks.length}`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>COMBINED LIQUIDITY</span>
                <strong>
                  {assets ? formatLiquidity(totalLiquidity) : "—"}
                </strong>
              </div>

              <div>
                <span>WIDEST PRICE GAP</span>
                <strong>
                  {widest
                    ? `${widest.symbol} ${formatPercent(
                        widest.deviation
                      )}`
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="onc-table-wrap">
              <table className="onc-table">
                <thead>
                  <tr>
                    <th>ASSET</th>
                    <th>TOKEN ADDRESS</th>
                    <th>ONCHAIN PRICE</th>
                    <th>REFERENCE</th>
                    <th>GAP</th>
                    <th>LIQUIDITY</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {assets === null
                    ? stocks.map((item) => (
                        <tr key={item.symbol}>
                          <td>
                            <strong>{item.symbol}</strong>
                          </td>
                          <td colSpan={6}>
                            <div className="onc-skel" />
                          </td>
                        </tr>
                      ))
                    : assets.map((row) => {
                        const stock = row.stock;
                        const deviation = stock?.priceDeviation;

                        return (
                          <tr key={row.item.symbol}>
                            <td>
                              <button
                                className="onc-asset"
                                onClick={() =>
                                  onSelectStock?.(row.item.symbol)
                                }
                                title="Open full analysis"
                              >
                                <strong>{row.item.symbol}</strong>
                                <span>{row.item.name}</span>
                              </button>
                            </td>

                            {stock ? (
                              <>
                                <td>
                                  <code>
                                    {shortAddress(stock.solana?.address)}
                                  </code>

                                  <button
                                    className="onc-icon"
                                    title="Copy token address"
                                    onClick={() =>
                                      copyText(
                                        stock.solana?.address,
                                        row.item.symbol
                                      )
                                    }
                                  >
                                    {copied === row.item.symbol ? (
                                      "✓"
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </td>

                                <td>{formatPrice(stock.price)}</td>

                                <td>
                                  {formatPrice(stock.referencePrice)}
                                </td>

                                <td
                                  className={
                                    deviation == null
                                      ? ""
                                      : deviation >= 0
                                        ? "onc-pos"
                                        : "onc-neg"
                                  }
                                >
                                  {formatPercent(deviation)}
                                </td>

                                <td>
                                  {formatLiquidity(stock.liquidity)}
                                </td>

                                <td>
                                  <a
                                    className="onc-link"
                                    href={`https://solscan.io/token/${stock.solana?.address}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="View on Solscan"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                </td>
                              </>
                            ) : (
                              <td colSpan={6} className="onc-muted">
                                Unavailable
                                {row.error ? `: ${row.error}` : ""}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>

            <p className="onc-muted small">
              Onchain price is the Solana market price. Reference
              is the price of the underlying stock. The gap shows
              how closely the token tracks it.
            </p>

          </section>

        </div>

      </main>

    </div>
  );
}