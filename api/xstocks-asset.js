const XSTOCKS_API =
  "https://api.xstocks.fi/api/v2/public";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({
      error: "Symbol is required",
    });
  }

  try {
    const response = await fetch(
      `${XSTOCKS_API}/assets/${encodeURIComponent(symbol)}`
    );

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        error: "xStocks returned an invalid response",
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          "Unable to fetch xStocks asset",
      });
    }

    return res.status(200).json({
      success: true,
      asset: data,
    });
  } catch (error) {
    console.error(
      "[StockFlow] xStocks asset error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Unable to connect to xStocks",
    });
  }
}