const functions = require("firebase-functions");
const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

exports.askAI = functions.https.onRequest(async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ answer: completion.data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).send("AI error");
  }
});
