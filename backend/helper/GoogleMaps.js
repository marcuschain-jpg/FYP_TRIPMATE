// Helper to get Geo-Location
const axios = require("axios");

async function getLatLng(placeName) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`,
      {
        params: {
          key: process.env.gMapsApiKey,
          input: placeName,
          inputtype: "textquery",
          fields: "geometry,name,place_id"
        }
      }
    );

    const candidate = response.data.candidates?.[0];
    if (!candidate) return null;

    return {
      lat: candidate.geometry.location.lat,
      lng: candidate.geometry.location.lng,
      placeId: candidate.place_id
    };
  } catch (err) {
    console.error("Google Maps API error:", err.message);
    return null;
  }
}

module.exports = { getLatLng };