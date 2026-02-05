const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const RequireAuth = require("../middlewares/RequireAuths.js");
const { createChatbotItinerary } = require("../helper/ChatbotItinerary.js");
const { createChatbotActivity } = require("../helper/ChatbotActivity.js");
const TSPAlgo = require("../helper/TSPAlgo.js");
const { getLatLng } = require("../helper/GoogleMaps.js");
const axios = require("axios");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ITINERARY_REGEX =
  /itinerary|plan trip|create trip|make trip|generate trip|build trip/i;

const CHAT_SYSTEM_PROMPT = "You are a helpful travel assistant. Answer naturally.";

const PLAN_SYSTEM_PROMPT = `
You are a travel itinerary generator.

If the user does not provide dates, choose reasonable future dates.

Return ONLY valid JSON.
Do NOT include explanations, comments, or markdown.

Format:

{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "days": [
    {
      "day": 1,
      "places": [
        {
          "name": "",
          "address": ""
        }
      ]
    }
  ]
}

Rules:
- startDate and endDate must never be empty
`;

// POST /Chatbot/message
router.post("/message", RequireAuth(["registered","premium"]), async (req, res) => {
  try {
    const { message, history = [] } = req.body;

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
    const match = inputLower.match(/\b(?:to|in|for|at)\s+([a-zA-Z\s]{2,40})/i);
    if (match) {
      destination = match[1]
        .replace(/just now|suggestion|gave me/gi, "")
        .trim();
    }

    if (isItinerary && destination) {
      systemPrompt += `\nDestination: ${destination}`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
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
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "";

    // ---- ITINERARY CASE ----

    if (isItinerary) {
      // Parse JSON returned by AI
      let itineraryJson;
      try {
        const firstBrace = outputText.indexOf("{");
        const lastBrace = outputText.lastIndexOf("}");
        const cleanJson = outputText.slice(firstBrace, lastBrace + 1);
        itineraryJson = JSON.parse(cleanJson);
      } catch (e) {
        return res.status(500).json({ error: "Invalid JSON returned by AI" });
      }

      // Get destination lat/lng/placeId
      const destinationData = await getLatLng(destination);
      
      console.log("DESTINATION:", destination);
      console.log("GEOCODE RESULT:", destinationData);
      // if (!destinationData || !destinationData.lat || !destinationData.lng) {
      //   return res.status(400).json({
      //     error: "Unable to geocode destination"
      //   });
      // }

      // Create itinerary
      const tripCreateRes = await axios.post(
        "http://localhost:8080/Itinerary/CreateItinerary",
        {
          iName: `Trip to ${destination || "Unknown"}`,
          iDest: {
            name: destination || "Unknown",
            placeid: destinationData.placeId,
            lat: destinationData.lat,
            lng: destinationData.lng
          },
          start: itineraryJson.startDate,
          end: itineraryJson.endDate,
          type: "Private"
        },
        { headers: { Cookie: req.headers.cookie } }
      );

      if (!tripCreateRes.data || !tripCreateRes.data[0]) {
        return res.status(500).json({ error: "Trip creation failed" });
      }

      const tripId = tripCreateRes.data[0].itinerary_id;

      // Collect all activities
      const activities = [];
      const placeIds = [];

      for (const day of itineraryJson.days) {
        for (const place of day.places) {
          const data = await getLatLng(place.name);

          if (!data || !data.lat || !data.lng) {
            console.log("Skipping place (no geo):", place.name);
            continue;
          }

          activities.push({
            aName: place.name,
            aLoc: place.name,
            aAddress: place.address || "",
            aDate: day.day,
            lat: data.lat,
            lng: data.lng,
            aPlaceID: data.placeId
          });

          if (data.placeId) {
            placeIds.push(data.placeId);
          }
        }
      }

      if (placeIds.length !== activities.length) {
        return res.json({ isItinerary: true, tripId });
      }
      
      // Reorder using TSPAlgo
      const sortedActivities = await TSPAlgo(activities, placeIds, "DRIVE");

      // Save activities
      for (let i = 0; i < sortedActivities.length; i++) {
        const a = sortedActivities[i];
        await axios.post(
          "http://localhost:8080/Itinerary/CreateActivity",
          {
            aName: a.aName,
            aLoc: a.aLoc,
            aAddress: a.aAddress,
            aDate: a.aDate,
            i_id: tripId,
            aOrder: i + 1,
            aPlaceID: a.aPlaceID,
            lat: a.lat,
            lng: a.lng,
            aCost: 0
          },
          { headers: { Cookie: req.headers.cookie } }
        );
      }

      return res.json({ isItinerary: true, tripId });
    }

    // ---- Normal chat message ----
    return res.json({ isItinerary: false, reply: outputText });

  } catch (err) {
    console.error(err);
    return res.json({ isItinerary: false, reply: "AI service unavailable. Please try again." });
  }
});

module.exports = router;