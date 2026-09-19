
const JUPITER_API =
  "https://api.jup.ag/swap/v2/order";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const {
    inputMint,
    outputMint,
    amount,
  } = req.query;

  if (!inputMint || !outputMint || !amount) {
    return res.status(400).json({
      error:
        "inputMint, outputMint, and amount are required",
    });
  }

  if (
    typeof inputMint !== "string" ||
    typeof outputMint !== "string" ||
    typeof amount !== "string"
  ) {
    return res.status(400).json({
      error: "Invalid query parameters",
    });
  }

  if (!/^[1-9][0-9]*$/.test(amount)) {
    return res.status(400).json({
      error:
        "Amount must be a positive integer in atomic units",
    });
  }

  const apiKey =
    process.env.JUPITER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error:
        "Jupiter API key is not configured",
    });
  }

  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
    });

    // No taker is supplied.
    // This requests quote information only.
    const response = await fetch(
      `${JUPITER_API}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
        },
      }
    );

    const responseText =
      await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        error:
          "Jupiter returned an invalid response",
      };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.errorMessage ||
          data?.error ||
          "Jupiter quote request failed",
      });
    }

    return res.status(200).json({
      success: true,
      quote: {
        inputMint: data.inputMint,
        outputMint: data.outputMint,
        inAmount: data.inAmount,
        outAmount: data.outAmount,
        priceImpact: data.priceImpact,
        routePlan: data.routePlan,
        feeBps: data.feeBps,
        feeMint: data.feeMint,
        router: data.router,
      },
    });
  } catch (error) {
    console.error(
      "[StockFlow] Jupiter quote error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to connect to Jupiter",
    });
  }
}