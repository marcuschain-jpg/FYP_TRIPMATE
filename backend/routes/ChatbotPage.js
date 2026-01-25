const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ITINERARY_REGEX =
  /(trip|itinerary|schedule).*(create|plan|generate|build)|(create|plan|generate|build).*(trip|itinerary|schedule)/i;

const CHAT_SYSTEM_PROMPT = "You are a helpful travel assistant. Answer naturally.";

const PLAN_SYSTEM_PROMPT = `
You are a travel itinerary generator.
You MUST respond with ONLY valid JSON.
Do NOT include explanations, comments, markdown, or text outside JSON.

{
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "time": "morning",
          "activity": "",
          "location": ""
        }
      ]
    }
  ]
}
`;

// POST /Chatbot/message
router.post("/message", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const inputLower = message.toLowerCase();
    const isItinerary = ITINERARY_REGEX.test(inputLower);

    let systemPrompt = isItinerary
      ? PLAN_SYSTEM_PROMPT
      : CHAT_SYSTEM_PROMPT;

    // Destination extraction
    let destination = "";
    const match = inputLower.match(/(to|in|for|at)\s+([a-zA-Z ]+)/);
    if (match) {
      destination = match[2].trim();
    }

    if (isItinerary && destination) {
      systemPrompt += `\nDestination: ${destination}`;
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const outputText =
      response.output[0]?.content
        ?.filter(c => c.type === "output_text")
        .map(c => c.text)
        .join("\n");

    let parsed = outputText;

    if (isItinerary) {
    try {
        parsed = JSON.parse(outputText);
    } catch (e) {
        return res.status(500).json({
        error: "Invalid JSON returned by AI"
        });
    }
    }

    return res.json({
    reply: parsed,
    isItinerary
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Chatbot failed" });
  }
});

module.exports = router;