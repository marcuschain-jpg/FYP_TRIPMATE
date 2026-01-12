const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const axios = require("axios");
// --- DB stuff ---
const pool = require("../helper/db.js");
// Photo stuff ---
const path = require("path") // photo path
const fs = require("fs"); // to delete photos
const InsertPhoto = require("../middlewares/PhotoImp.js"); // edit photo path and insert
const Geotag = require("../helper/Geotag.js"); // geotag photo
const { ExtractPhotoS3, ImportPhotoS3, DeletePhotoS3 } = require("../helper/S3FileSys.js"); // get link that may expire from AWS S3
// Load custom env file
dotenv.config({ path: "keys.env" });
// --- Arrange activity functions ---
const InitRealtime = require("../helper/Realtime.js"); 
const TSPAlgo = require("../helper/TSPAlgo.js");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user
// --- Collaboration Invitation ---
const SendEmail = require("../helper/SendEmail.js");

// Default key and center coord to initialize maps
router.get("/maps", RequireAuth(["registered", "premium"]),(req, res) => {
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
      `SELECT i.itinerary_id, i.itinerary_name, i.itinerary_dest, i.start_date, i.end_date, i.completed, i.type, 'host' as userIType,
       i.num_ppl, i.capacity
       FROM itinerary i
       WHERE i.user_host_id = $1
       UNION
       SELECT i.itinerary_id, i.itinerary_name, i.itinerary_dest, i.start_date, i.end_date, i.completed, i.type, 'visitor' as userIType,
       i.num_ppl, i.capacity
       FROM itinerary i
       JOIN shared_itinerary si ON i.itinerary_id = si.itinerary_id  
       WHERE si.user_id = $1
       UNION
       SELECT i.itinerary_id, i.itinerary_name, i.itinerary_dest, i.start_date, i.end_date, i.completed, i.type, 'visitor' as userIType,
       i.num_ppl, i.capacity
       FROM itinerary i
       JOIN group_trip gt ON i.itinerary_id = gt.itinerary_id
       ORDER BY completed ASC`, [userid]
    );

    return res.json(data.rows);
  }

  catch(err){
    return res.status(500).send({message: 'View all itineraries failed'});
  }
});

router.post("/CreateItinerary", RequireAuth(["registered", "premium"]), async(req, res) => {
  const {iName, iDest, start, end, type} = req.body;
  const userid = req.userid;
  console.log("Dest!!", iDest)

  try{
    const data = await pool.query(
      `INSERT INTO itinerary (itinerary_name, itinerary_dest, start_date, end_date, user_host_id, type, placeid, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING itinerary_id, 'host' as useritype`, [iName, iDest.name, start, end, userid, type, iDest.placeid, iDest.lat, iDest.lng]
    );
    return res.json(data.rows);
  }
  catch(err){
    console.log(err);
    return res.status(500).send("Create itinerary failed");
  }
});

router.delete("/DeleteItinerary", RequireAuth(["registered", "premium"]), async(req, res) =>{
  // For Private Trips
  const {i_id, isHost} = req.body;
  let photoData = null;
  const userid = req.userid;
  console.log("itineraryid: ", i_id);
  console.log("isHost: ", isHost);

  // Retrieve num of ppl for update later
    try {
        const data = await pool.query(`SELECT num_ppl, capacity FROM itinerary WHERE itinerary_id = $1`, [i_id])
        num_ppl = data.rows[0].num_ppl;
    }
    catch(err) { console.log(err); return res.status(500).send({message: "Failed to get num_ppl in ExitItinerary"});}

  // Only 1 person, safe to delete itinerary & media
  if(num_ppl === 1){
    try{
      // Delete photos of itinerary if have
      photoData = await pool.query(
        `SELECT ap.photo_url FROM activity_photo ap
        JOIN activity a ON ap.activity_id = a.activity_id
        JOIN itinerary i on a.itinerary_id = i.itinerary_id
        WHERE i.itinerary_id = $1`, [i_id]
      );
    }
    catch(err) {photoData = null;}

    if(photoData){
      await Promise.all(
        photoData.rows.map(data => {DeletePhotoS3(data.photo_url);
      })
      );
    }

    // Delete itinerary
    try{
      const data = await pool.query(
        `DELETE FROM itinerary
         WHERE itinerary_id=$1`, [i_id]
      );
      if(data.rowCount > 0) return res.send({deleteItinerary: true})
    }
    catch(err) {console.log(err); return res.send({message: "Fail to remove itinerary"});}
  }

  // person > 1, if host - re-assign host
  else if(isHost && num_ppl > 1){
    // Remove record from shared_itinerary returning user_id
    // Update user_host_id in itinerary
    // Update num_ppl in db
    try{
        const data = await pool.query(
        `WITH selectrandom AS(
          SELECT user_id
          FROM shared_itinerary
          WHERE itinerary_id=$1
          ORDER BY random()
          LIMIT 1
          ),
          transferhost AS(
          DELETE FROM shared_itinerary
          WHERE itinerary_id=$1 AND user_id=(SELECT user_id from selectrandom)
          )
          UPDATE itinerary
          SET user_host_id = (SELECT user_id from selectrandom),
          num_ppl = $2
          WHERE itinerary_id = $1
          RETURNING num_ppl`, [i_id, num_ppl - 1]
        );
        if(data.rowCount > 0) return res.send(data.rows[0].num_ppl);
      }
      catch(err) {console.log(err); return res.send({message: "Fail to delegate new host"});}
    }
  
  // person > 1, if visitor - exit
  else if(!isHost && num_ppl > 1){
    // Remove user from group_trips table
    try{
      const data = await pool.query(
        `WITH deleteuser AS(
         DELETE FROM shared_itinerary
         WHERE itinerary_id=$1 AND user_id=$2
         )
         UPDATE itinerary
         SET num_ppl = $3
         WHERE itinerary_id=$1
         RETURNING num_ppl`, [i_id, userid, num_ppl-1]
      );
      if(data.rowCount > 0) return res.send(data.rows[0].num_ppl);
    }
    catch(err) {console.log(err); return res.send({message: "Fail to delegate new host"});}
  }

});

router.post("/CitySearch", RequireAuth(["registered", "premium"]), async(req, res) => {
  const {input} = req.body;

  // 1. Search in autocomplete to only get cities
  try {
    const acRawResponse = await axios.post(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        input: input,  // matches curl example
        includedPrimaryTypes: "(cities)",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.gMapsApiKey,
          "X-Goog-FieldMask": "suggestions.placePrediction.placeId"
        },
      }
    );
    // response.data.results contains the search results
    const acResponse = acRawResponse.data.suggestions.slice(0,4);

    // 2. Search in place details with place id to get coordinates
    const response = await Promise.all(
      acResponse.map(async (item) => {
      const r = await axios.get(
        `https://places.googleapis.com/v1/places/${item.placePrediction.placeId}`,
        
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.gMapsApiKey,
            "X-Goog-FieldMask": "id,formattedAddress,location"
          },
        }
      );
      //console.log(r.data);
      return {
        id: r.data.id,
        name: r.data.formattedAddress,
        lat: r.data.location.latitude,
        lng: r.data.location.longitude
      };
    })
   );
   return res.json(response);
  } catch (err) {
    console.error("Places Text Search error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to fetch autocomplete" });
  }
});

// ================================== TripDetailsPage ============================================
router.get("/GetItinerary", RequireAuth(["registered", "premium"]), async(req, res) => {
  const i_id = req.query["i_id"];
  const userid = req.userid;

  try{
    const rawdata = await pool.query(
      `SELECT i.itinerary_id, i.itinerary_name, i.itinerary_dest, i.start_date, i.end_date, i.completed, i.type, i.num_ppl,
       u.first_name, u.last_name, u.email, i.user_host_id
       FROM itinerary i
       LEFT JOIN shared_itinerary si ON i.itinerary_id = si.itinerary_id
       LEFT JOIN users u ON si.user_id = u.userid
       WHERE i.itinerary_id = $1`, [i_id]
    );
    let data = rawdata.rows.map(({user_host_id,...item}) => {
      return{...item, isHost: user_host_id === userid}
    })
    return res.json(data);
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

router.post("/AddCollaborator", RequireAuth(["premium"]), async(req,res) => {
  const {i_id, email, i_name} = req.body;
  const host_userid = req.userid;
  let userid_collab = null;
  let inv_id = null;
  let host_name = "";
  let sentEmail = false;

  try{
    const data = await pool.query(
      `SELECT userid, type, first_name, last_name FROM users WHERE email = $1 OR userid = $2`, [email, host_userid]
    )
    if(data.rowCount === 1) return res.status(500).send({message: "No user found with this email"});
    data.rows.forEach(element => {
      if (element.type !== "premium") return res.status(500).send({message: "Invitee needs to be a premium user"});
      else if(element.userid === host_userid) host_name = `${element.first_name} ${element.last_name}`;
      else if(element.userid !== host_userid) userid_collab = element.userid;
    });
  }
  catch(err) {return res.status(500).send({message: "Query Failed"});}

  await pool.query("BEGIN");
  if(userid_collab){
    try{
      await pool.query( // Delete previous invitations
        `DELETE FROM invitation
         WHERE itinerary_id = $1 AND user_id = $2`, [i_id, userid_collab]
      );

      const data = await pool.query( // Create new invitation
        `INSERT INTO invitation(itinerary_id, user_id)
         VALUES($1, $2)
         RETURNING inv_id`, [i_id, userid_collab]
      );
      await pool.query("COMMIT");

      if(data.rowCount > 0) inv_id = data.rows[0].inv_id;
    }
    catch(err) {
      await pool.query("ROLLBACK");
      return res.status(500).send({message: "AddCollaboratorFailed"});
    }

    const content = {
      recipient: email,
      subject: `Tripmate Collaborative Invitation`,
      text: `Collaborate with ${host_name} on "${i_name}"! Accept your invitation!`,
      html: `
      <p>Collaborate with ${host_name} on "${i_name}" with TripMate! Accept your invitation to start planning together!</p>
      <p><a href=http://localhost:3000/confirm/${inv_id}>Click me!</a></p>`
    };
    sentEmail = await SendEmail(content);
    if(!sentEmail) return res.status(500).send({message: "Failed to send email"});
    return res.send(true);
  }
});

router.delete("/DeleteCollaborator", RequireAuth(["premium"]), async(req,res) => {
  const {i_id, email} = req.body;
  let userid_collab = null;
  let num_ppl = 0;

  try{
    const data = await pool.query(
      `SELECT
      (SELECT userid FROM users WHERE email = $1) AS userid,
      (SELECT num_ppl FROM itinerary WHERE itinerary_id = $2) as num_ppl;`, [email, i_id]
    )
    if (data.rowCount > 0) {
      userid_collab = data.rows[0].userid;
      num_ppl = data.rows[0].num_ppl;
    }
    else if(data.rowCount === 0) return res.status(500).send({message: "No user found with this email"});
  }
  catch(err) {return res.status(500).send({message: "No user found with this email"});}
  
  if(userid_collab){
    try{
      const data = await pool.query(
        `WITH updatenumppl AS(
         UPDATE itinerary
         SET num_ppl = $3
         WHERE itinerary_id = $1
        )
         DELETE FROM shared_itinerary
         WHERE itinerary_id = $1 AND user_id = $2`, [i_id, userid_collab, num_ppl - 1]
      );
      if(data.rowCount > 0) return res.send(true);
    }
    catch(err) {return res.status(500).send({message: "DeleteCollaboratorFailed"});}
  }
});

router.post("/AcceptCollabInv", async(req,res) => {
  const {inv_id} = req.body;
  let data = null;
  let numPpl = 0;


  try{
    const rawData = await pool.query(
      `SELECT num_ppl FROM itinerary WHERE itinerary_id = (SELECT itinerary_id FROM invitation WHERE inv_id =$1)`, [inv_id]
    );
    if(rawData.rows[0].num_ppl >= 5) return res.send({check: false, message: "Itinerary has already reached max capacity!"})
  }
  catch(err) {console.log(err); return res.status(500).send({message: "error"});}

  // Insert record in shared itinerary
  await pool.query("BEGIN");
  try{
    await pool.query(
      `INSERT INTO shared_itinerary(itinerary_id, user_id)
       SELECT itinerary_id, user_id FROM invitation
       WHERE inv_id =$1
       ON CONFLICT DO NOTHING`, [inv_id]
    );

    await pool.query(
      `UPDATE itinerary i
       SET num_ppl=(SELECT count(*) + 1 FROM shared_itinerary si
       WHERE si.itinerary_id = i.itinerary_id)
       WHERE i.itinerary_id = (SELECT itinerary_id FROM invitation WHERE inv_id =$1)`, [inv_id]
    );

    data = await pool.query(
      `DELETE FROM invitation
       WHERE inv_id = $1`, [inv_id]
    );
    await pool.query("COMMIT")

    if(data.rowCount > 0) return res.send(true);
    else return res.send({check:false, message: "Invitation link expired or invalid. Please get the host to resend the invitation"});
  }
  catch(err) { 
    await pool.query("ROLLBACK");
    console.log(err);
    res.status(500).send({message: "Invitation Expired"});
  }
});

// ================================== ItineraryPage ============================================
router.get("/GetAllActivities", RequireAuth(["registered", "premium"]), async(req, res) => {
  const i_id = req.query['i_id'];

  try{
    const data = await pool.query(
      `SELECT a.activity_id, a.activity_name, a.activity_address, i.itinerary_name, a.activity_location, a.longitude, a.latitude, i.type, i.num_ppl,
       i.longitude, i.latitude,
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

  // 1. Delete photos in S3 storage
  try{
    photoData = await pool.query(
      `SELECT photo_url
       FROM activity_photo
       WHERE activity_id = $1`, [activityid]
    );
  }
  catch(err) {photoData = null;}

  if(photoData){
    await Promise.all(
      photoData.rows.map(data => {DeletePhotoS3(data.photo_url);
    })
    )
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
      const filePath = path.join(__dirname, "../uploads", file.filename)
      try{ await Geotag(filePath, lng, lat); }
      catch(err) { console.log("failed to geotag"); } 
      fs.unlink((filePath + "_original"), (err) => {
      if(err) console.log("failed to remove from media", err)
    });
    }

    // Store in S3 then unlink, return link to S3
    const s3URL = await ImportPhotoS3();

    // Prepare for insert in db
    const photoRecRaw = s3URL.map(file => [aName, file, lng, lat, a_id]);
    const photoParams = s3URL.map((_,i) => {
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
      if(data.rowCount > 0 && createAct === true) //successfully update
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
      const filePath = path.join(__dirname, "../uploads", file.filename)
      try{ await Geotag(filePath, lng, lat); }
      catch(err) { console.log("failed to geotag"); } 
      fs.unlink((filePath + "_original"), (err) => {
      if(err) console.log("failed to remove from media", err)
    });
    }

    // Store in S3 then unlink, return link to S3
    const s3URL = await ImportPhotoS3();
    console.log(s3URL);

    // Prepare for insert in db
    const photoRecRaw = s3URL.map(file => [aName, file, lng, lat, a_id]);
    const photoParams = s3URL.map((_,i) => {
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
	     ap.photo_id, ap.photo_url, ap.photo_title, i.latitude AS i_lat, i.longitude AS i_lng,
	     TO_CHAR(a.activity_date, 'YYYY-MM-DD') AS activity_date
       FROM activity a
       JOIN itinerary i ON a.itinerary_id = i.itinerary_id
	     LEFT JOIN activity_photo ap ON a.activity_id = ap.activity_id
       WHERE a.activity_id = $1`,[a_id]
    );
    const updatedData = await ExtractPhotoS3(data.rows);
    return res.json(updatedData);
  }
  catch(err)
  {
    return res.status(500).send({message:"GetActivityToEdit failed"});
  }
});

router.get("/GetActivityToCreate", RequireAuth(["registered", "premium"]), async(req,res) => {
  const a_id = req.query['i_id'];

  try{
    const data = await pool.query(
      `SELECT longitude, latitude FROM itinerary
       WHERE itinerary_id = $1 `, [a_id]
    )
    return res.send(data.rows);
  }
  catch(err) { return res.status(500).send({message:"Failed to retrieve coords."}) }
});

router.post("/LocSearch", RequireAuth(["registered", "premium"]), async(req, res) => {
  const {input, lng, lat} = req.body;

  try {
    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchText",
      {
        textQuery: input,  // Search
        pageSize: 5,       // Limit results
        locationBias: {    // Center to itinerary city location
        circle: {
          center: {
            latitude: lat,
            longitude:lng
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

    return res.json(predictions);
  } catch (err) {
    console.error("Places Text Search error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to fetch autocomplete" });
  }
});

router.delete("/DeleteActivityPhoto", RequireAuth(["registered", "premium"]), async(req, res) => {
  const {photo_id} = req.body;
  let url = null;
  let deleteFromS3 = false;

  // 1. Take out real photo url from db
  try{
    const data = await pool.query(
      `SELECT photo_url FROM activity_photo
       WHERE photo_id=$1`, [photo_id]
    );
    url = data.rows[0].photo_url;
  }
  catch(err) {res.status(500).send("Error select photo url for deletion");}

  // 2. Delete photo in S3
  if(url) {
    deleteFromS3 = await DeletePhotoS3(url);
  }
  
  //3. Delete photo in db
  if(deleteFromS3){
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
  }
  
});


module.exports = router;