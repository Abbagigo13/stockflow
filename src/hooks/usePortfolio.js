import { useCallback, useEffect, useState } from "react";
import {
  Connection,
  PublicKey,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const SOLANA_RPC =
  import.meta.env.VITE_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

const XSTOCKS_API =
  "https://api.xstocks.fi/api/v2/public";

const JUPITER_API =
  "https://api.jup.ag/price/v3";

const STOCK_SYMBOLS = [
  "NVDAx",
  "AAPLx",
  "TSLAx",
  "SPYx",
];

function shortenAddress(address) {
  if (!address) return "—";

  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

async function fetchXStockMetadata() {
  const results = await Promise.allSettled(
    STOCK_SYMBOLS.map(async (symbol) => {
      const response = await fetch(
        `${XSTOCKS_API}/assets/${encodeURIComponent(symbol)}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${symbol}`
        );
      }

      const asset = await response.json();

      const deployments =
        asset?.deployments ||
        asset?.networks ||
        [];

      const solana = deployments.find(
        (deployment) =>
          deployment?.network?.toLowerCase() ===
          "solana"
      );

      if (!solana?.address) {
        return null;
      }

      return {
        symbol: asset.symbol || symbol,
        name: asset.name || symbol,
        logo: asset.logo || null,
        mint: solana.address,
      };
    })
  );

  return results
    .filter(
      (result) =>
        result.status === "fulfilled" &&
        result.value
    )
    .map((result) => result.value);
}

async function fetchJupiterPrices(mints) {
  if (!mints.length) {
    return {};
  }

  const response = await fetch(
    `${JUPITER_API}?ids=${mints.join(",")}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch portfolio prices"
    );
  }

  return response.json();
}

async function readTokenAccounts(
  connection,
  owner,
  programId
) {
  try {
    const response =
      await connection.getParsedTokenAccountsByOwner(
        owner,
        {
          programId,
        },
        "confirmed"
      );

    return response.value || [];
  } catch (error) {
    console.error(
      "Token account request failed:",
      error
    );

    return [];
  }
}

async function loadPortfolio(address) {
  if (!address) {
    return {
      holdings: [],
      totalValue: 0,
    };
  }

  const connection = new Connection(
    SOLANA_RPC,
    "confirmed"
  );

  const owner = new PublicKey(address);

  const [
    tokenAccounts,
    token2022Accounts,
    xstocks,
  ] = await Promise.all([
    readTokenAccounts(
      connection,
      owner,
      TOKEN_PROGRAM_ID
    ),
    readTokenAccounts(
      connection,
      owner,
      TOKEN_2022_PROGRAM_ID
    ),
    fetchXStockMetadata(),
  ]);

  const allAccounts = [
    ...tokenAccounts,
    ...token2022Accounts,
  ];

  const xstockMap = new Map(
    xstocks.map((stock) => [
      stock.mint,
      stock,
    ])
  );

  const candidateAccounts = allAccounts
    .map((account) => {
      const info =
        account?.account?.data?.parsed?.info;

      if (!info) return null;

      const mint = info.mint;
      const tokenAmount =
        info.tokenAmount;

      const rawAmount = Number(
        tokenAmount?.amount || 0
      );

      const decimals = Number(
        tokenAmount?.decimals || 0
      );

      const amount =
        Number.isFinite(rawAmount) &&
        Number.isFinite(decimals)
          ? rawAmount /
            Math.pow(10, decimals)
          : 0;

      if (
        !mint ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return null;
      }

      const stock =
        xstockMap.get(mint);

      if (!stock) {
        return null;
      }

      return {
        ...stock,
        mint,
        amount,
        decimals,
      };
    })
    .filter(Boolean);

  if (!candidateAccounts.length) {
    return {
      holdings: [],
      totalValue: 0,
    };
  }

  const grouped = new Map();

  for (const holding of candidateAccounts) {
    const existing =
      grouped.get(holding.mint);

    if (existing) {
      existing.amount += holding.amount;
    } else {
      grouped.set(
        holding.mint,
        { ...holding }
      );
    }
  }

  const holdings = [
    ...grouped.values(),
  ];

  const prices = await fetchJupiterPrices(
    holdings.map(
      (holding) => holding.mint
    )
  );

  let totalValue = 0;

  const enrichedHoldings =
    holdings.map((holding) => {
      const quote =
        prices?.[holding.mint];

      const price = Number(
        quote?.usdPrice || 0
      );

      const value =
        holding.amount * price;

      totalValue += value;

      return {
        ...holding,
        price,
        value,
        change24h: Number(
          quote?.priceChange24h || 0
        ),
        liquidity: Number(
          quote?.liquidity || 0
        ),
        formattedMint:
          shortenAddress(
            holding.mint
          ),
      };
    });

  return {
    holdings: enrichedHoldings,
    totalValue,
  };
}

export function usePortfolio(address) {
  const [holdings, setHoldings] =
    useState([]);

  const [totalValue, setTotalValue] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  const refreshPortfolio =
    useCallback(
      async (initial = false) => {
        if (!address) {
          setHoldings([]);
          setTotalValue(0);
          setError(null);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        try {
          if (initial) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          setError(null);

          const result =
            await loadPortfolio(address);

          setHoldings(
            result.holdings
          );

          setTotalValue(
            result.totalValue
          );
        } catch (err) {
          console.error(
            "Portfolio loading failed:",
            err
          );

          setError(
            err?.message ||
              "Failed to load portfolio."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [address]
    );

  useEffect(() => {
    refreshPortfolio(true);
  }, [refreshPortfolio]);

  return {
    holdings,
    totalValue,
    loading,
    refreshing,
    error,
    refreshPortfolio: () =>
      refreshPortfolio(false),
  };
}