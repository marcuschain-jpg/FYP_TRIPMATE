const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const axios = require("axios");
// --- DB stuff ---
const pool = require("../helper/db.js");
// Path manipulation ---
const path = require("path") // photo path
const fs = require("fs"); // to delete photos
const InsertPhoto = require("../middlewares/PhotoImp.js"); // edit photo path and insert
const Geotag = require("../helper/Geotag.js"); // geotag photo
// Load custom env file
dotenv.config({ path: "keys.env" });
// --- Call other functions ---
const InitRealtime = require("../helper/Realtime.js");
const TSPAlgo = require("../helper/TSPAlgo.js"); // Arrange activity
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user

// Default key and center coord to initialize maps
router.get("/maps", (req, res) => {
 return res.json({
    apiKey: process.env.gMapsApiKey,
    center: { lat: 1.3521, lng: 103.8198 },
  });
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
    return res.json(data.rows);
  }

  catch(err){
    return res.status(500).send('View all itineraries failed');
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
    return res.json(data.rows);
  }
  catch(err){
    return res.status(500).send("Create itinerary failed");
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
      return res.send(true);
    }
  }
  catch(err){
    return res.status(500).send("Create itinerary failed");
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
    return res.json(data.rows);
  }
  catch(err){ //error running sql
    return res.status(500).send('Load itinerary failed');
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
      return res.send(true);
    }
  }
  catch(err){
    return res.status(500).send("UpdateCompleteFailed");
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
    return res.json(data.rows);
  }
  catch(err)
  {
    return res.status(500).send("GetAllActivities failed");
  }
});

router.delete("/DeleteActivity", RequireAuth(["registered", "premium"]), async(req, res) => {
  const {activityid, i_id} = req.body;
  let photosDeleted = false;
  let photoData = null;
  let payload = null;
  const io = req.app.get("io");

  // 1. Delete photos in storage
  try{
    photoData = await pool.query(
      `SELECT photo_url
       FROM activity_photo
       WHERE activity_id = $1`, [activityid]
    );
  }
  catch(err) {photoData = null;}

  if(photoData){
    console.log(photoData.rows);
    photoData.rows.map(data => {
      const url = data.photo_url.replace("http://localhost:8080/images/","");

      console.log("URL! ", url);
      //Delete photo in storage
      if(url) {
        photoStoragePath = path.join(__dirname, "../../storage");
        finalURL = path.join(photoStoragePath, url);
        fs.unlink(finalURL, (err) => {
          if(err) console.log("failed to remove from storage", err)
        });
        photosDeleted = true;
      }
    })
  }
  
  
  // Delete activities cascade down other tables
  try{
    payload = await pool.query(
      `DELETE FROM activity
       WHERE activity_id = $1
       RETURNING activity_id`, [activityid]
    );
    if(payload.rowCount === 1) //successfully delete
    {
      io.to(`trip_${i_id}`).emit("notification", { message: "activity deleted!", payload:payload.rows });
      return res.send(true);
    }
  }
  catch(err){
    console.log(err);
    return res.status(500).send("DeleteActivity failed");
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
router.post("/CreateActivity", RequireAuth(["registered", "premium"]), InsertPhoto(), async(req,res) => {
  const {aName, aLoc, aAddress, aDate, i_id, aOrder, aPlaceID, lng, lat} = req.body;
  let a_id = null;
  let createAct = false;
  let havePhoto = false;
  const io = req.app.get("io");
  let payload = null;

  if(req.files.length > 0) havePhoto = true;
  const realOrder = (aOrder === true) ? 0 : null

  try{
    // 1. Create activity in activity
    payload = await pool.query(
      `INSERT INTO activity (activity_name, activity_location, activity_address, activity_date, gmaps_placeid, itinerary_id, activity_order, longitude, latitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING activity_id, activity_name, activity_address, activity_location, longitude, latitude,
       TO_CHAR(activity_date, 'YYYY-MM-DD') AS activity_date`, [aName, aLoc, aAddress, aDate, aPlaceID, i_id, realOrder, lng, lat]
    );
    if(payload.rowCount === 1) //successfully insert
    {
      createAct = true;
      a_id = payload.rows[0].activity_id;
      console.log("a_id: ", payload.rows);
    }
  }
  catch(err){
    console.log(err);
    return res.status(500).send("CreateActivity Failed");
  }

  // 2. Upload photos in activity_photo

  if(havePhoto){
    // Geotag
    for (const file of req.files){
      const filePath = path.join(__dirname, "../../storage", file.filename)
      try{ await Geotag(filePath, lng, lat); }
      catch(err) { console.log("failed to geotag"); } 
      fs.unlink((filePath + "_original"), (err) => {
      if(err) console.log("failed to remove from storage", err)
    });
    }

    // Prepare photo content for upload in db
    const photoRecRaw = req.files.map(file => [aName, `http://localhost:8080/images/${file.filename}`, lng, lat, a_id]);
    const photoParams = req.files.map((_,i) => {
      const counter = i*5;
      return(`($${counter+1}, $${counter+2}, $${counter+3}, $${counter+4}, $${counter+5})`);
    }).join(", ");
    const photoRec = photoRecRaw.flat();

    // Upload photo content in db
    try{
      const data = await pool.query(
      `INSERT INTO activity_photo (photo_title, photo_url, longitude, latitude, activity_id)
       VALUES ${photoParams}
      `, photoRec
      );
      if(data.rowCount > 0 && createAct === true) //successfully update
      {
        io.to(`trip_${i_id}`).emit("notification", { message: "activity created!", payload:payload.rows });
        return res.send(true);
      }
    }
    catch(err){
      console.log(err);
      return res.status(500).send("Error inserting photos")
    }
  }
  else{
    if(createAct) {
      io.to(`trip_${i_id}`).emit("notification", { message: "activity created!", payload: payload.rows  });
      return res.send(true);
    }
  }
});

router.patch("/EditActivity", RequireAuth(["registered", "premium"]), InsertPhoto(), async(req, res) => {
  const {a_id, i_id , aName, aLoc, aAddress, aDate, aOrder, aPlaceID, lng, lat} = req.body;
  let havePhoto = false;
  let updateAct = false;
  let order = false;
  let payload = null;
  const io = req.app.get("io");

  if(req.files.length > 0) havePhoto = true;

  if(aOrder === 'true') order = true;
  else order = false;
  const realOrder = (order === true) ? 0 : null
  

  // 1. Update activity info in activity
  try{
    payload = await pool.query(
      `UPDATE activity
       SET activity_name = $2, activity_location = $3, activity_address = $4, activity_date = $5, gmaps_placeid = $6, activity_order = $7
       , longitude = $8, latitude = $9
       WHERE activity_id = $1
       RETURNING activity_id, activity_name, activity_address, activity_location, longitude, latitude,
       TO_CHAR(activity_date, 'YYYY-MM-DD') AS activity_date`, [a_id, aName, aLoc, aAddress, aDate, aPlaceID, realOrder, lng, lat]
    );
    if(payload.rowCount === 1) //successfully update
    {
      updateAct = true;
    }
  }
  catch(err){
    return res.status(500).send("EditActivityFailed");
  }

  // 2. Store photos in activity_photo 
  if(havePhoto){

    // Geotag
    for (const file of req.files){
      const filePath = path.join(__dirname, "../../storage", file.filename)
      try{ await Geotag(filePath, lng, lat); }
      catch(err) { console.log("failed to geotag"); } 
      fs.unlink((filePath + "_original"), (err) => {
      if(err) console.log("failed to remove from storage", err)
    });
    }
    

    // Prepare for insert in db
    const photoRecRaw = req.files.map(file => [aName, `http://localhost:8080/images/${file.filename}`, lng, lat, a_id]);
    const photoParams = req.files.map((_,i) => {
      const counter = i*5;
      return(`($${counter+1}, $${counter+2}, $${counter+3}, $${counter+4}, $${counter+5})`);
    }).join(", ");
    const photoRec = photoRecRaw.flat();

    // Insert photo in db
    try{
      const data = await pool.query(
      `INSERT INTO activity_photo (photo_title, photo_url, longitude, latitude, activity_id)
      VALUES ${photoParams}`, photoRec
      );
      if(data.rowCount > 0 && updateAct === true) //successfully update
      {
        io.to(`trip_${i_id}`).emit("notification", { message: "activity edited!", payload:payload.rows });
        return res.send(true);
      }
    }
    catch(err){
      console.log(err);
      return res.status(500).send("Error inserting photos")
    }
  }
  else{
    if(updateAct) {
      io.to(`trip_${i_id}`).emit("notification", { message: "activity edited!" , payload:payload.rows });
      return res.send(true);
    }
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
    return res.json(data.rows);
  }
  catch(err)
  {
    return res.status(500).send("GetActivityToEdit failed");
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
    return res.json(predictions);
  } catch (err) {
    console.error("Places Text Search error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to fetch autocomplete" });
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
      return res.send(true)
    }
  }
  catch(err){
    return res.status(500).send("Error deleting photos from db");
  }
  
});


module.exports = router;