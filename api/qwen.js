
/* global process */

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

    const {
      messages,
      model = "qwen3.8-max",
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "messages must be a non-empty array.",
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
      }),
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