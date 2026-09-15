import {
  Wallet,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

function formatUsd(value) {
  if (!Number.isFinite(value)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAmount(value) {
  if (!Number.isFinite(value)) return "0";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value);
}

export default function PortfolioCard({
  address,
  holdings,
  totalValue,
  loading,
  refreshing,
  error,
  onRefresh,
}) {
  if (!address) {
    return (
      <div className="stock-card portfolio-card">
        <div className="portfolio-card-header">
          <div>
            <span className="section-label">
              PORTFOLIO
            </span>

            <h3>Your onchain positions</h3>
          </div>

          <div className="portfolio-icon">
            <Wallet size={18} />
          </div>
        </div>

        <p className="portfolio-empty">
          Connect your Solana wallet to see your
          tokenized stock positions.
        </p>
      </div>
    );
  }

  return (
    <div className="stock-card portfolio-card">
      <div className="portfolio-card-header">
        <div>
          <span className="section-label">
            PORTFOLIO
          </span>

          <h3>Your onchain positions</h3>
        </div>

        <button
          className="portfolio-refresh-button"
          onClick={onRefresh}
          disabled={loading || refreshing}
          title="Refresh portfolio"
        >
          <RefreshCw
            size={15}
            className={
              loading || refreshing
                ? "portfolio-spin"
                : ""
            }
          />
        </button>
      </div>

      {error ? (
        <div className="portfolio-error">
          {error}
        </div>
      ) : loading ? (
        <div className="portfolio-loading">
          <RefreshCw
            size={18}
            className="portfolio-spin"
          />

          <span>
            Reading your Solana positions...
          </span>
        </div>
      ) : (
        <>
          <div className="portfolio-total">
            <span>Total portfolio value</span>

            <strong>
              {formatUsd(totalValue)}
            </strong>
          </div>

          {holdings.length === 0 ? (
            <div className="portfolio-empty">
              <Wallet size={20} />

              <div>
                <strong>
                  No xStock positions detected
                </strong>

                <p>
                  This wallet currently doesn't
                  hold any supported tokenized
                  stocks.
                </p>
              </div>
            </div>
          ) : (
            <div className="portfolio-holdings">
              {holdings.map((holding) => {
                const positive =
                  holding.priceChange24h >= 0;

                return (
                  <div
                    className="portfolio-position"
                    key={holding.mint}
                  >
                    <div className="portfolio-position-main">
                      <div className="portfolio-stock-icon">
                        {holding.logo ? (
                          <img
                            src={holding.logo}
                            alt=""
                          />
                        ) : (
                          holding.symbol
                            .replace("x", "")
                            .slice(0, 2)
                        )}
                      </div>

                      <div>
                        <strong>
                          {holding.symbol}
                        </strong>

                        <span>
                          {holding.name}
                        </span>
                      </div>
                    </div>

                    <div className="portfolio-position-right">
                      <strong>
                        {formatUsd(
                          holding.value
                        )}
                      </strong>

                      <span>
                        {formatAmount(
                          holding.amount
                        )}{" "}
                        tokens
                      </span>

                      <small
                        className={
                          positive
                            ? "portfolio-change positive"
                            : "portfolio-change negative"
                        }
                      >
                        {positive ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}

                        {positive ? "+" : ""}
                        {holding.priceChange24h.toFixed(
                          2
                        )}
                        %
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="portfolio-wallet">
            <span>Wallet</span>

            <code>
              {address.slice(0, 6)}...
              {address.slice(-6)}
            </code>
          </div>
        </>
      )}
    </div>
  );
}