const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function test() {
  const res = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      { role: "user", content: "Di hola en español" }
    ],
  });

  console.log(res.choices[0].message.content);
}

test();