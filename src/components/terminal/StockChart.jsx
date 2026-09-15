import {
  useEffect,
  useState,
} from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { fetchHistoricalPrices } from "../../lib/market";

const CACHE_DURATION = 2 * 60 * 1000;

const chartCache = new Map();

function getCacheKey(address, timeframe) {
  return `${address}:${timeframe}`;
}

function formatChartData(prices) {
  return prices.map((item) => ({
    time: new Date(
      item.timestamp
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    price: item.price,
  }));
}

export default function StockChart({
  stock,
}) {
  const [timeframe, setTimeframe] =
    useState("1D");

  const [data, setData] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [rateLimited, setRateLimited] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const address =
        stock?.solana?.address;

      if (!address) {
        setData([]);
        setLoading(false);
        setError(
          "No Solana token address available."
        );
        return;
      }

      const cacheKey =
        getCacheKey(
          address,
          timeframe
        );

      const cached =
        chartCache.get(cacheKey);

      /*
       * Use cached historical data when it
       * is still fresh.
       */
      if (
        cached &&
        Date.now() - cached.timestamp <
          CACHE_DURATION
      ) {
        setData(cached.data);
        setError(null);
        setRateLimited(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setRateLimited(false);

        const prices =
          await fetchHistoricalPrices(
            address,
            timeframe
          );

        if (cancelled) {
          return;
        }

        const formatted =
          formatChartData(prices);

        /*
         * Save successful requests so switching
         * around the terminal doesn't repeatedly
         * hit Birdeye.
         */
        chartCache.set(cacheKey, {
          timestamp: Date.now(),
          data: formatted,
        });

        setData(formatted);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Historical chart error:",
          err
        );

        const message =
          err?.message ||
          "Unable to load chart";

        /*
         * Birdeye returns HTTP 429 when the
         * historical endpoint is temporarily
         * rate limited.
         */
        if (
          message.includes("429") ||
          message
            .toLowerCase()
            .includes("too many requests")
        ) {
          setRateLimited(true);

          /*
           * Don't destroy an already loaded chart
           * just because a refresh was rate limited.
           */
          if (data.length === 0) {
            setError(
              "Historical data is temporarily rate limited. Live market data is still available."
            );
          }
        } else {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [
    stock?.solana?.address,
    timeframe,
  ]);

  return (
    <div className="stock-chart">
      <div className="stock-chart-toolbar">
        <div className="chart-timeframes">
          {[
            "1H",
            "1D",
            "1W",
            "1M",
          ].map((item) => (
            <button
              key={item}
              className={
                timeframe === item
                  ? "active"
                  : ""
              }
              onClick={() =>
                setTimeframe(item)
              }
            >
              {item}
            </button>
          ))}
        </div>

        <span>
          {loading
            ? "Loading..."
            : rateLimited
              ? "Rate limited"
              : error
                ? "Unavailable"
                : `${data.length} points`}
        </span>
      </div>

      <div className="stock-chart-area">
        {loading ? (
          <div className="chart-state">
            Loading historical data...
          </div>
        ) : error ? (
          <div className="chart-state">
            <div>
              {error}
            </div>

            {rateLimited && (
              <small
                style={{
                  display: "block",
                  marginTop: "8px",
                  opacity: 0.6,
                }}
              >
                Please try again shortly.
              </small>
            )}
          </div>
        ) : data.length === 0 ? (
          <div className="chart-state">
            No historical data available.
          </div>
        ) : (
          <>
            {rateLimited && (
              <div
                style={{
                  padding:
                    "8px 12px",
                  fontSize: "11px",
                  opacity: 0.65,
                  textAlign: "right",
                }}
              >
                Showing cached data ·
                live price continues
                streaming
              </div>
            )}

            <ResponsiveContainer
              width="100%"
              height={360}
            >
              <AreaChart
                data={data}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  strokeOpacity={0.12}
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 10,
                  }}
                  minTickGap={30}
                />

                <YAxis
                  domain={[
                    "auto",
                    "auto",
                  ]}
                  tick={{
                    fontSize: 10,
                  }}
                  width={70}
                />

                <Tooltip
                  formatter={(value) =>
                    `$${Number(
                      value
                    ).toFixed(2)}`
                  }
                />

                <Area
                  type="monotone"
                  dataKey="price"
                  strokeWidth={2}
                  fillOpacity={0.08}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}