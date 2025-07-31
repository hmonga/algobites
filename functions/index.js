const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const { OpenAI } = require("openai");
const express = require("express");
const cors = require("cors");

setGlobalOptions({ region: "us-central1", memory: "512MiB", timeoutSeconds: 30 });

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/", async (req, res) => {
  const prompt = req.body.prompt;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // ✅ Now reading the secret at runtime
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY.value(),
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.status(200).json({ answer: completion.choices[0].message.content });
  } catch (err) {
    console.error("OpenAI API error:", err);
    res.status(500).json({ error: "Failed to generate response from AI." });
  }
});

exports.askAIv2 = onRequest({ secrets: [OPENAI_API_KEY] }, app);
