const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const axios = require("axios");
// --- DB stuff ---
const supabase = require("../helper/db.js")
// --- geo tag lib ---
const {exiftool} = require("exiftool-vendored"); //photo geotag
const path = require("path") //photo path
const multer = require("multer");
const postgres = require("postgres");
// --- end geo tag lib ---

// Load custom env file
dotenv.config({ path: "keys.env" });


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads")); // make sure uploads exists
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // get extension
    const name = `${Date.now()}${ext}`; // e.g., 1699045600000.jpg
    cb(null, name);
  },
});
const upload = multer({storage});

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

router.post("/upload", upload.single("photo"), async (req, res) => {
    const filePath = req.file.path;

    try{
        await exiftool.write(filePath,{
            GPSLatitude: 1.3521,
            GPSLongitude: 103.8198,
            GPSLatitudeRef: "N",
            GPSLongitudeRef: "E"
        });

        res.json({message: filePath});
    }
    catch(err) {
        console.error(err);
        res.status(500).json({error: "Failed to geotag photo"})
    }
});

router.post("/test", async(req, res) => {
  const {activity} = req.body;
  
  const {data,error} = await supabase
  .from("messages")
  .insert([{content: activity}]);

  if(error) return res.status(500).send("failed :(");
  res.send("insert 成功! :D");
});

router.get("/testLoad", async(req, res) => {
  
  const {data,error} = await supabase
  .from("messages")
  .select("*");

  if(error) return res.status(500).send("failed :(");
  res.send(data);
});

module.exports = router;