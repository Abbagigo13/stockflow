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

import "./StockChart.css";

const CACHE_DURATION = 2 * 60 * 1000;

const ACCENT = "#3dffa0";
const NEGATIVE = "#ff5a7a";
const TIMEFRAMES = ["1H", "1D", "1W", "1M"];

const chartCache = new Map();

function getCacheKey(address, timeframe) {
  return `${address}:${timeframe}`;
}

/*
 * Short label for the bottom axis. Longer timeframes
 * show dates, because repeating times of day is confusing.
 */
function formatLabel(timestamp, timeframe) {
  const date = new Date(timestamp);

  if (timeframe === "1M") {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  if (timeframe === "1W") {
    return `${date.toLocaleDateString([], {
      weekday: "short",
    })} ${date.toLocaleTimeString([], {
      hour: "numeric",
    })}`;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatChartData(prices, timeframe) {
  return prices.map((item) => ({
    label: formatLabel(
      item.timestamp,
      timeframe
    ),
    fullTime: new Date(
      item.timestamp
    ).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    price: item.price,
  }));
}

export default function StockChart({
  stock,
  height = 360,
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

  // Increasing this number re-runs the load (Retry button).
  const [attempt, setAttempt] =
    useState(0);

  const address = stock?.solana?.address;

  useEffect(() => {
    let cancelled = false;

    async function load() {
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
        Date.now() - cached.timestamp 
          < CACHE_DURATION
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
          formatChartData(
            prices,
            timeframe
          );

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

        const lower =
          message.toLowerCase();

        const limited =
          message.includes("429") ||
          lower.includes(
            "too many requests"
          ) ||
          lower.includes(
            "rate limited"
          );

        setData([]);
        setRateLimited(limited);

        setError(
          limited
            ? "Chart data is temporarily rate limited. Live prices are still available."
            : message
        );
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
  }, [address, timeframe, attempt]);

  const change =
    data.length > 1 &&
    data[0].price > 0
      ? ((data[data.length - 1].price -
          data[0].price) /
          data[0].price) *
        100
      : null;

  return (
    <div className="sfc-root">
      <div className="sfc-toolbar">
        <div className="sfc-timeframes">
          {TIMEFRAMES.map((item) => (
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

        <span className="sfc-status">
          {loading ? (
            "Loading..."
          ) : error ? (
            rateLimited ? (
              "Rate limited"
            ) : (
              "Unavailable"
            )
          ) : (
            <>
              {data.length} points
              {change !== null && (
                <>
                  {" · "}
                  <span
                    style={{
                      color:
                        change >= 0
                          ? ACCENT
                          : NEGATIVE,
                    }}
                  >
                    {change >= 0
                      ? "+"
                      : ""}
                    {change.toFixed(2)}%
                    {" over "}
                    {timeframe}
                  </span>
                </>
              )}
            </>
          )}
        </span>
      </div>

      <div className="sfc-area">
        {loading ? (
          <div
            className="sfc-skeleton"
            style={{ height }}
          />
        ) : error ? (
          <div
            className="sfc-state"
            style={{ minHeight: height }}
          >
            <div>{error}</div>

            {rateLimited && (
              <small>
                Please try again shortly.
              </small>
            )}

            <button
              className="sfc-retry"
              onClick={() =>
                setAttempt(
                  (count) => count + 1
                )
              }
            >
              Retry
            </button>
          </div>
        ) : data.length === 0 ? (
          <div
            className="sfc-state"
            style={{ minHeight: height }}
          >
            <div>
              No price data for this
              period.
            </div>

            <small>
              Try a longer timeframe.
            </small>
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={height}
          >
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id="sfcFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={ACCENT}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor={ACCENT}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 10,
                  fill: "rgba(255,255,255,0.5)",
                }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />

              <YAxis
                domain={["auto", "auto"]}
                tick={{
                  fontSize: 10,
                  fill: "rgba(255,255,255,0.5)",
                }}
                axisLine={false}
                tickLine={false}
                width={70}
                tickFormatter={(value) =>
                  `$${Number(value).toFixed(2)}`
                }
              />

              <Tooltip
                contentStyle={{
                  background: "#0b0f0d",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{
                  color:
                    "rgba(255,255,255,0.6)",
                }}
                formatter={(value) => [
                  `$${Number(value).toFixed(2)}`,
                  "Price",
                ]}
                labelFormatter={(
                  label,
                  payload
                ) =>
                  payload?.[0]?.payload
                    ?.fullTime ?? label
                }
              />

              <Area
                type="monotone"
                dataKey="price"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#sfcFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: ACCENT,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}