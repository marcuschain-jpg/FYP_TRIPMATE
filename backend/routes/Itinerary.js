const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const axios = require("axios")

// Load custom env file
dotenv.config({ path: "keys.env" });

router.get("/maps", (req, res) => {
 res.json({
    apiKey: process.env.gMapsApiKey,
    center: { lat: 1.3521, lng: 103.8198 },
  });
});

router.get("/autocomplete", async (req, res) => {
  const input = req.query.input;
  if (!input) return res.json({ results: [] });

  try {
    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchText",
      {
        textQuery: input,  // matches curl example
        pageSize: 10,      // limit results
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.gMapsApiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.priceRange"
        },
      }
    );

    // response.data.results contains the search results
    const predictions = response.data.results.map((r) => ({
      id: r.placeId,
      name: r.displayName,
      address: r.formattedAddress,
      lat: r.location.lat,
      lng: r.location.lng,
    }));

    res.json(predictions);
  } catch (err) {
    console.error("Places Text Search error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch autocomplete" });
  }
});


module.exports = router;