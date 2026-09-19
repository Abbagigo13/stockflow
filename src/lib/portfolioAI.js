export async function generatePortfolio({
  amount,
  riskProfile,
  goals = [],
  marketData = [],
}) {
  if (!amount || Number(amount) <= 0) {
    throw new Error("Investment amount must be greater than zero.");
  }

  if (!riskProfile) {
    throw new Error("Risk profile is required.");
  }

  const prompt = `
You are StockFlow AI, an AI portfolio analyst for tokenized equities
trading on Solana.

Your job is to create a hypothetical diversified portfolio using ONLY
the assets provided in the market data below.

IMPORTANT:
- Do not invent assets.
- Do not invent prices.
- Do not guarantee returns.
- Do not present the portfolio as financial advice.
- Allocation percentages must add up to exactly 100.
- Amounts must add up to the investment amount.
- Consider diversification, momentum, liquidity and risk.
- Explain the reasoning clearly.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not include text outside the JSON object.

USER INVESTMENT:
$${Number(amount).toFixed(2)}

RISK PROFILE:
${riskProfile}

USER GOALS:
${goals.length > 0 ? goals.join(", ") : "Growth and diversification"}

AVAILABLE MARKET DATA:
${JSON.stringify(marketData, null, 2)}

Return this exact JSON structure:

{
  "totalInvestment": number,
  "riskProfile": "conservative | balanced | aggressive",
  "aiScore": number,
  "diversificationScore": number,
  "summary": "string",
  "allocations": [
    {
      "symbol": "string",
      "percentage": number,
      "amount": number,
      "reason": "string"
    }
  ],
  "risks": [
    "string"
  ],
  "confidence": number
}
`;

  const response = await fetch("/api/qwen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen3.8-max",
      messages: [
        {
          role: "system",
          content:
            "You are StockFlow AI. Return only valid JSON when requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    }),
  });

  const responseText = await response.text();

let data;

try {
  data = responseText
    ? JSON.parse(responseText)
    : {};
} catch {
  throw new Error(
    `Server returned invalid JSON: ${responseText.slice(0, 300)}`
  );
}

  if (!response.ok) {
    throw new Error(data?.error || "StockFlow AI request failed.");
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Qwen returned an empty response.");
  }

  let portfolio;

  try {
    portfolio = JSON.parse(content);
  } catch {
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      portfolio = JSON.parse(cleaned);
    } catch {
      throw new Error("Qwen returned invalid portfolio JSON.");
    }
  }

  if (
    !Array.isArray(portfolio.allocations) ||
    portfolio.allocations.length === 0
  ) {
    throw new Error("Qwen returned no portfolio allocations.");
  }

  const totalPercentage = portfolio.allocations.reduce(
    (sum, item) => sum + Number(item.percentage || 0),
    0
  );

  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(
      `Portfolio allocation must equal 100%. Received ${totalPercentage}%.`
    );
  }

  return portfolio;
}
