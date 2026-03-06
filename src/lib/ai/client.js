// src/lib/ai/client.js
const OpenAI = require("openai");

function getAiClient() {
  const provider = process.env.AI_PROVIDER || "openrouter";

  if (provider === "openrouter") {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "RastreaCom",
      },
    });
  }

  throw new Error(`AI_PROVIDER no soportado: ${provider}`);
}

module.exports = { getAiClient };