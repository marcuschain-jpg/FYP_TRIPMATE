const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate user

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const CHAT_SYSTEM_PROMPT = "You are a helpful travel assistant. Answer naturally.";

const ITINERARY_PROMPT = `
You are a travel itinerary generator.

Create a pretty and readable travel itinerary. 
Format it like this (Markdown/Plain Text):
- Day 1: Place A (Address), Place B (Address)
- Day 2: Place C (Address), Place D (Address)

Do NOT return JSON. Return a friendly, human-readable text.
`;

// POST /Chatbot/message
router.post("/message", RequireAuth(["registered","premium"]), async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const messages = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      ...history.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      })),
      { role: "user", content: message }
    ];

    // Call OpenAI
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: messages
    });

    const outputText =
      response.output[0]?.content
        ?.filter(c => c.type === "output_text")
        .map(c => c.text)
        .join("\n") || "No response.";

    return res.json({
      reply: outputText
    });

  } catch (err) {
    console.error(err);
    return res.json({ reply: "AI service unavailable. Please try again." });
  }
});

module.exports = router;