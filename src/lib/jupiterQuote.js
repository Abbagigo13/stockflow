
const USDC_MINT =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/**
 * Fetch a Jupiter quote through our
 * server-side Vercel API endpoint.
 *
 * This is quote-only.
 * No wallet signature or transaction execution.
 */
export async function fetchJupiterQuote({
  outputMint,
  amountUsd,
}) {
  if (!outputMint) {
    throw new Error("Missing output token address");
  }

  if (
    !Number.isFinite(amountUsd) ||
    amountUsd <= 0
  ) {
    throw new Error("Amount must be greater than zero");
  }

  // USDC has 6 decimal places.
  const amount = String(
    Math.round(amountUsd * 1_000_000)
  );

  const params = new URLSearchParams({
    inputMint: USDC_MINT,
    outputMint,
    amount,
  });

  const response = await fetch(
    `/api/jupiter-quote?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data?.error ||
        "Unable to fetch Jupiter quote"
    );
  }

  return data.quote;
}