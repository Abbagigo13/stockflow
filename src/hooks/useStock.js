import { useEffect, useState } from "react";
import { getStockData } from "../lib/market";

const REFRESH_INTERVAL = 10_000; // 10 seconds

export function useStock(symbol) {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    async function loadStock(initial = false) {
      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError(null);

        const data = await getStockData(symbol);

        if (!cancelled) {
          setStock(data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);

          setError(
            err.message || "Failed to load stock data"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    if (symbol) {
      loadStock(true);

      intervalId = setInterval(() => {
        loadStock(false);
      }, REFRESH_INTERVAL);
    }

    return () => {
      cancelled = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [symbol]);

  return {
    stock,
    loading,
    refreshing,
    error,
    lastUpdated,
  };
}