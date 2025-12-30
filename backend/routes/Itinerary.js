const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const axios = require("axios");
// --- DB stuff ---
const pool = require("../helper/db.js");
// --- image lifecycle & geo tag ---
const {exiftool} = require("exiftool-vendored"); // photo geotag
const path = require("path") // photo path
const multer = require("multer"); // manage and store files
const fs = require("fs"); // to delete photos
// Load custom env file
dotenv.config({ path: "keys.env" });
// --- Call other functions ---
const InitRealtime = require("../helper/Realtime.js");
const TSPAlgo = require("../helper/TSPAlgo.js");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../storage")); // store in storage folder
  },
  filename: (req, file, cb) => {
    const name = `${Math.random().toString(32)}_dateVal_${Date.now().toString(32)}_${file.originalname}`; // e.g., uuid_date_file1.jpg
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
router.get("/GetAllItineraries", RequireAuth(["registered", "premium"]), async(req, res) => {
  const userid = req.userid;

  try{
    const data = await pool.query(
      `SELECT itinerary_id, itinerary_name, itinerary_dest, start_date, end_date, completed
       FROM itinerary
       WHERE user_host_id = $1
       ORDER BY completed ASC`, [userid]
    );
    res.json(data.rows);
  }

  catch(err){ //error running sql
    res.status(500).send('View all itineraries failed');
  }
});

router.post("/CreateItinerary", RequireAuth(["registered", "premium"]), async(req, res) => {
  const {iName, iDest, start, end} = req.body;
  const userid = req.userid;

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

router.delete("/DeleteItinerary", RequireAuth(["registered", "premium"]), async(req, res) =>{
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
router.get("/GetItinerary", RequireAuth(["registered", "premium"]), async(req, res) => {
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

router.patch("/UpdateItineraryComplete", RequireAuth(["registered", "premium"]), async(req, res) => {
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
router.get("/GetAllActivities", RequireAuth(["registered", "premium"]), async(req, res) => {
  const i_id = req.query['i_id'];

  try{
    const data = await pool.query(
      `SELECT a.activity_id, a.activity_name, a.activity_address, i.itinerary_name, a.activity_location, a.longitude, a.latitude,
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

router.delete("/DeleteActivity", RequireAuth(["registered", "premium"]), async(req, res) => {
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

router.get("/ArrangeItinerary", RequireAuth(["registered", "premium"]), (req, res) => {
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
    const transitMode = "DRIVE";

    // reorder all activities
    await pool.query(`SELECT reorder_all_activities()`);
    
    await Promise.all(
      dates.map(async (date) =>{
        // extract data from db

        console.log(date);
        data = await pool.query(
          `SELECT activity_id, gmaps_placeid
           FROM activity
           WHERE activity_date = $1
           ORDER BY activity_order ASC`, [date]
        );
        const aID = data.rows.map(row => row.activity_id);
        const aPlaceID = data.rows.map(row => row.gmaps_placeid);
        //extract route matrix & run algo
        OrderActID = await TSPAlgo(aID, aPlaceID, transitMode);
        console.log(OrderActID);
        
        // update order in db
        newOrderActID = await OrderActID.slice(1);
        const orderUpdate = await newOrderActID.map((id, idx) =>`WHEN ${id} THEN ${idx+1}`).join(' ');
        console.log(orderUpdate);
        const a_idUpdate = await newOrderActID.join(', ');

        await pool.query(
          `UPDATE activity
           SET activity_order = CASE activity_id
           ${orderUpdate}
           END
           WHERE activity_id IN (${a_idUpdate});`
        );
      })
    );
    
    runtimeEnd = performance.now();
    const duration = (runtimeEnd-runtimeStart)/1000;
    console.log("Time took: ", duration);
    console.log("Finished algo for: ", i_id);
  });
});

//==================================================== ActivityFormPage ==========================
router.post("/CreateActivity", RequireAuth(["registered", "premium"]), upload.array("media"), async(req,res) => {
  const {aName, aLoc, aAddress, aDate, i_id, aOrder, aPlaceID, lng, lat} = req.body;
  let a_id = null;
  let createAct = false;

  const realOrder = (aOrder === true) ? 0 : null

  try{
    // 1. Create activity in activity
    const data = await pool.query(
      `INSERT INTO activity (activity_name, activity_location, activity_address, activity_date, gmaps_placeid, itinerary_id, activity_order, longitude, latitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING activity_id`, [aName, aLoc, aAddress, aDate, aPlaceID, i_id, realOrder, lng, lat]
    );
    if(data.rowCount === 1) //successfully insert
    {
      createAct = true;
      a_id = data.rows[0].activity_id;
      console.log("a_id: ", data.rows);
    }
  }
  catch(err){
    console.log(err);
    res.status(500).send("CreateActivity Failed");
  }

  // 2. Upload photos in activity_photo

  const photoRecRaw = req.files.map(file => [aName, `http://localhost:8080/images/${file.filename}`, lng, lat, a_id]);
  const photoParams = req.files.map((_,i) => {
    const counter = i*5;
    return(`($${counter+1}, $${counter+2}, $${counter+3}, $${counter+4}, $${counter+5})`);
  }).join(", ");
  const photoRec = photoRecRaw.flat();

  console.log(photoRecRaw);
  console.log(photoParams);

  try{
    const data = await pool.query(
    `INSERT INTO activity_photo (photo_title, photo_url, longitude, latitude, activity_id)
     VALUES ${photoParams}`, photoRec
    );
    if(data.rowCount > 0 && createAct === true) //successfully update
    {
      res.send(true);
    }
  }
  catch(err){
    console.log(err);
    res.status(500).send("Error inserting photos")
  }
});

router.patch("/EditActivity", RequireAuth(["registered", "premium"]), upload.array("media"), async(req, res) => {
  const {a_id, aName, aLoc, aAddress, aDate, aOrder, aPlaceID, lng, lat} = req.body;
  let updateAct = false;
  const photoRecRaw = req.files.map(file => [aName, `http://localhost:8080/images/${file.filename}`, lng, lat, a_id]);
  const photoParams = req.files.map((_,i) => {
    const counter = i*5;
    return(`($${counter+1}, $${counter+2}, $${counter+3}, $${counter+4}, $${counter+5})`);
  }).join(", ");
  const photoRec = photoRecRaw.flat();

  const realOrder = (aOrder === true) ? 0 : null

  // 1. Update activity info in activity
  try{
    const data = await pool.query(
      `UPDATE activity
       SET activity_name = $2, activity_location = $3, activity_address = $4, activity_date = $5, gmaps_placeid = $6, activity_order = $7
       , longitude = $8, latitude = $9
       WHERE activity_id = $1`, [a_id, aName, aLoc, aAddress, aDate, aPlaceID, realOrder, lng, lat]
    );
    if(data.rowCount === 1) //successfully update
    {
      updateAct = true;
    }
  }
  catch(err){
    res.status(500).send("UpdateCompleteFailed");
  }

  // 2. Store photos in activity_photo 
  try{
    const data = await pool.query(
    `INSERT INTO activity_photo (photo_title, photo_url, longitude, latitude, activity_id)
     VALUES ${photoParams}`, photoRec
    );
    if(data.rowCount > 0 && updateAct === true) //successfully update
    {
      res.send(true);
    }
  }
  catch(err){
    console.log(err);
    res.status(500).send("Error inserting photos")
  }

});


router.get("/GetActivityToEdit", RequireAuth(["registered", "premium"]), async(req, res) => {
  const a_id = req.query['a_id'];
  try{
    const data = await pool.query(
      `SELECT a.activity_name, a.activity_location, a.activity_address, a.activity_order, a.gmaps_placeid, a.longitude, a.latitude,
	     ap.photo_id, ap.photo_url, ap.photo_title,
	     TO_CHAR(a.activity_date, 'YYYY-MM-DD') AS activity_date
       FROM activity a
	     LEFT JOIN activity_photo ap
	     ON a.activity_id = ap.activity_id
       WHERE a.activity_id = $1`,[a_id]
    );
    res.json(data.rows);
  }
  catch(err)
  {
    res.status(500).send("GetActivityToEdit failed");
  }
});

router.post("/LocSearch", RequireAuth(["registered", "premium"]), async(req, res) => {
  const {input} = req.body;

  try {
    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchText",
      {
        textQuery: input,  // matches curl example
        pageSize: 5,       // limit results
        locationBias: {    // triangulate location to city now its singapore
        circle: {
          center: {
            latitude: 1.352083,
            longitude:103.819836
            },
          radius: 500.0
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.gMapsApiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location"
        },
      }
    );
    // response.data.results contains the search results
    const predictions = response.data.places.map((r) => ({
      id: r.id,
      name: r.displayName.text,
      address: r.formattedAddress,
      lat: r.location.latitude,
      lng: r.location.longitude,
    }));

    console.log(predictions)
    res.json(predictions);
  } catch (err) {
    console.error("Places Text Search error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch autocomplete" });
  }
});

router.delete("/DeleteActivityPhoto", RequireAuth(["registered", "premium"]), async(req, res) => {
  const {photo_id, rawUrl} = req.body;
  const url = rawUrl.replace("http://localhost:8080/images/","");

  console.log("URL! ", url);
  //Delete photo in storage
  if(url) {
    photoStoragePath = path.join(__dirname, "../../storage");
    finalURL = path.join(photoStoragePath, url);
    fs.unlink(finalURL, (err) => {
      if(err) console.log("failed to remove from storage", err)
    });
  }
  
  //Delete photo in db
  try{
    const data = await pool.query(
      `DELETE FROM activity_photo
       WHERE photo_id = $1`, [photo_id]
    );
    if(data.rowCount > 0)
    {
      res.send(true)
    }
  }
  catch(err){
    res.status(500).send("Error deleting photos from db");
  }
  
});


module.exports = router;