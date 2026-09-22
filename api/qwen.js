
/* global process */
import { checkRateLimit } from "./_rateLimit.js";

const QWEN_MODEL = process.env.QWEN_MODEL || "qwen3.8-max";
const ALLOWED_MODELS = new Set([QWEN_MODEL]);
const MAX_MESSAGES = 6;
const MAX_TOTAL_CHARS = 60000;
const MAX_OUTPUT_TOKENS = 4000;
const ALLOWED_ROLES = new Set(["system", "user", "assistant"]);

const QWEN_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    if (!process.env.DASHSCOPE_API_KEY) {
      return res.status(500).json({
        error: "DASHSCOPE_API_KEY is not configured.",
      });
    }

        const limit = checkRateLimit(req, {
      name: "qwen",
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });

    if (!limit.allowed) {
      res.setHeader("Retry-After", String(limit.retryAfter));

      return res.status(429).json({
        error: `Too many AI requests. Please try again in ${limit.retryAfter} seconds.`,
      });
    }

          const { messages, model: requestedModel } = req.body || {};

      const model = ALLOWED_MODELS.has(requestedModel)
        ? requestedModel
        : QWEN_MODEL;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "messages must be a non-empty array.",
      });
    }
        const totalChars = messages.reduce(
      (sum, item) =>
        sum + (typeof item?.content === "string" ? item.content.length : 0),
      0
    );

    const wellFormed =
      messages.length <= MAX_MESSAGES &&
      messages.every(
        (item) =>
          item &&
          ALLOWED_ROLES.has(item.role) &&
          typeof item.content === "string"
      );

    if (!wellFormed || totalChars > MAX_TOTAL_CHARS) {
      return res.status(400).json({
        error: "Invalid or oversized request.",
      });
    }

    const response = await fetch(QWEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json",
      },
            body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
            signal: AbortSignal.timeout(120000),
    });

    const responseText = await response.text();

    let data = null;

    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error(
          "Qwen returned non-JSON response:",
          responseText
        );

        return res.status(502).json({
          error:
            "Qwen returned an invalid response.",
          details: responseText.slice(0, 500),
        });
      }
    } else {
      console.error(
        "Qwen returned an empty response.",
        response.status
      );

      return res.status(502).json({
        error:
          "Qwen returned an empty response.",
        status: response.status,
        statusText: response.statusText,
      });
    }

    if (!response.ok) {
      console.error("Qwen API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.message ||
          "Qwen API request failed.",
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Qwen server error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Failed to communicate with Qwen.",
    });
  }
}