const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const axios = require("axios");
// --- DB stuff ---
const pool = require("../helper/db.js");
// --- geo tag lib ---
const {exiftool} = require("exiftool-vendored"); //photo geotag
const path = require("path") //photo path
const multer = require("multer");
// Load custom env file
dotenv.config({ path: "keys.env" });
// --- Call other functions ---
const InitRealtime = require("../helper/Realtime.js");
const TSPAlgo = require("../helper/TSPAlgo.js");


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
  // 1. Get photo from ../uploads temporarily  
  const filePath = req.file.path;

    try{
        // 2. Geotag
        await exiftool.write(filePath,{ //sample coordinates
            GPSLatitude: 1.3521,
            GPSLongitude: 103.8198,
            GPSLatitudeRef: "N",
            GPSLongitudeRef: "E"
        });

        // 3. Save photo to storage, then db
        // 4. Remove temp photo from ../uploads
        res.json({message: filePath});
    }
    catch(err) {
        console.error(err);
        res.status(500).json({error: "Failed to geotag photo"})
    }
});

// ================================== Prototype Functions ===================================

// ================================== MyTripsPage============================================
router.get("/GetAllItineraries", async(req, res) => {
  const userid = req.query["userid"];

  try{
    const data = await pool.query(
      'SELECT itinerary_id, itinerary_name, itinerary_dest, start_date, end_date, completed FROM itinerary WHERE user_host_id = $1', [userid]
    );
    res.json(data.rows);
  }

  catch(err){ //error running sql
    res.status(500).send('View all itineraries failed');
  }
});

router.post("/CreateItinerary", async(req, res) => {
  const {iName, iDest, start, end, userid} = req.body;

  try{
    const data = await pool.query(
      `INSERT INTO itinerary (itinerary_name, itinerary_dest, start_date, end_date, user_host_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING itinerary_id`, [iName, iDest,start,end,userid]
    );
    res.json(data.rows);
  }
  catch(err){
    res.status(500).send("Create itinerary failed");
  }
});

router.delete("/DeleteItinerary", async(req, res) =>{
  const {itineraryid} = req.body;

  try{
    const data = await pool.query(
      `DELETE FROM itinerary
       WHERE itinerary_id = $1`, [itineraryid]
    );
    if(data.rowCount === 1) //successfully delete
    {
      res.send(true);
    }
  }
  catch(err){
    res.status(500).send("Create itinerary failed");
  }
});

// ================================== TripDetailsPage ============================================
router.get("/GetItinerary", async(req, res) => {
  const i_id = req.query["i_id"];

  try{
    const data = await pool.query(
      `SELECT itinerary_id, itinerary_name, itinerary_dest, start_date, end_date, completed
       FROM itinerary WHERE itinerary_id = $1`, [i_id]
    );
    res.json(data.rows);
  }
  catch(err){ //error running sql
    res.status(500).send('Load itinerary failed');
  }
});

router.patch("/UpdateItineraryComplete", async(req, res) => {
  const {i_id, completed} = req.body;

  try{
    const data = await pool.query(
      `UPDATE itinerary
       SET completed = $2
       WHERE itinerary_id = $1`, [i_id, completed]
    );
    if(data.rowCount === 1) //successfully update
    {
      res.send(true);
    }
  }
  catch(err){
    res.status(500).send("UpdateCompleteFailed");
  }
});

// ================================== ItineraryPage ============================================
router.get("/GetAllActivities", async(req, res) => {
  const i_id = req.query['i_id'];

  try{
    const data = await pool.query(
      `SELECT a.activity_id, a.activity_name, a.activity_address, i.itinerary_name, a.activity_location, 
       TO_CHAR(i.start_date, 'DD/MM/YYYY') AS start_date,
       TO_CHAR(i.end_date, 'DD/MM/YYYY') AS end_date,
       TO_CHAR(a.activity_date, 'YYYY-MM-DD') AS activity_date
       FROM itinerary i
       LEFT JOIN activity a
       ON i.itinerary_id = a.itinerary_id
       WHERE i.itinerary_id = $1
       ORDER BY activity_date ASC, a.activity_order ASC`, [i_id]
    );
    res.json(data.rows);
  }
  catch(err)
  {
    res.status(500).send("GetAllActivities failed");
  }
});

router.delete("/DeleteActivity", async(req, res) => {
  const {activityid} = req.body;
  
  try{
    const data = await pool.query(
      `DELETE FROM activity
       WHERE activity_id = $1`, [activityid]
    );
    if(data.rowCount === 1) //successfully delete
    {
      res.send(true);
    }
  }
  catch(err){
    res.status(500).send("DeleteActivity failed")
  }
  
});

router.get("/ArrangeItinerary", (req, res) => {
  const i_id = req.query['i_id'];
  console.log('id: ', i_id);
  res.send(true);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms)); //delay

  InitRealtime(req.app.get("io"), i_id, async (i_id) => {
    console.log("Start algo for: ", i_id);
    runtimeStart = performance.now();

    // get all dates in array
    let data = await pool.query(
        `SELECT DISTINCT(TO_CHAR(activity_date, 'YYYY-MM-DD')) AS date
         FROM activity`
    );
    const dates = data.rows.map(row => row.date);
    console.log(dates);
    const transitMode = "TRANSIT"

    // reorder all activities
    await pool.query(`SELECT reorder_all_activities()`);
    
    await Promise.all(
      dates.map(async (date) =>{
        // extract data from db
        console.log(date);
        data = await pool.query(
          `SELECT activity_name, gmaps_placeid, activity_order
           FROM activity
           WHERE activity_date = $1`, [date]
        );
        const aName = data.rows.map(row => row.activity_name);
        const aPlaceID = data.rows.map(row => row.gmaps_placeid);
        const aOrder = data.rows.map(row => row.activity_order);
        //extract route matrix & run algo and update order in db
        TSPAlgo(aName, aPlaceID, aOrder, transitMode);
      })
    );
    
    runtimeEnd = performance.now();
    const duration = (runtimeEnd-runtimeStart)/1000;
    console.log("Time took: ", duration);
    console.log("Finished algo for: ", i_id);
  });
});

//==================================================== ActivityFormPage ==========================
router.post("/CreateActivity", async(req,res) => {
  const {aName, aLoc, aAddress, aDate, i_id, aOrder} = req.body;
  const aPlaceID = "abcabc" //dummy

  const realOrder = (aOrder === true) ? 0 : null

  try{
    const data = await pool.query(
      `INSERT INTO activity (activity_name, activity_location, activity_address, activity_date, gmaps_placeid, itinerary_id, activity_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [aName, aLoc, aAddress, aDate, aPlaceID, i_id, realOrder]
    );
    if(data.rowCount === 1) //successfully insert
    {
      res.send(true);
    }
  }
  catch(err){
    console.log(err);
    res.status(500).send("CreateActivity Failed");
  }
});

router.patch("/EditActivity", async(req, res) => {
  const {a_id, aName, aLoc, aAddress, aDate, aOrder} = req.body;
  const aPlaceID = "abcabc" //dummy

  const realOrder = (aOrder === true) ? 0 : null

  try{
    const data = await pool.query(
      `UPDATE activity
       SET activity_name = $2, activity_location = $3, activity_address = $4, activity_date = $5, gmaps_placeid = $6, activity_order = $7   
       WHERE activity_id = $1`, [a_id, aName, aLoc, aAddress, aDate, aPlaceID, realOrder]
    );
    if(data.rowCount === 1) //successfully update
    {
      res.send(true);
    }
  }
  catch(err){
    res.status(500).send("UpdateCompleteFailed");
  }
});

router.get("/GetActivityToEdit", async(req, res) => {
  const a_id = req.query['a_id'];
  try{
    const data = await pool.query(
      `SELECT activity_name, activity_location, activity_address, activity_order,
       TO_CHAR(activity_date, 'YYYY-MM-DD') AS activity_date
       FROM activity
       WHERE activity_id = $1`,[a_id]
    );
    res.json(data.rows);
  }
  catch(err)
  {
    res.status(500).send("GetActivityToEdit failed");
  }
});








module.exports = router;