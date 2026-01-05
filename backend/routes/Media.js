const express = require("express");
const router = express.Router();
// --- DB stuff ---
const pool = require("../helper/db.js");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js");
// --- Photo Related ---
const path = require("path") // photo path
const fs = require("fs"); // to delete photos
const InsertPhoto = require("../middlewares/PhotoImp.js"); // edit photo path and insert
const Geotag = require("../helper/Geotag.js"); // geotag photo
const { ExtractPhotoS3, ImportPhotoS3, DeletePhotoS3 } = require("../helper/S3FileSys.js");

router.get("/GetActivityMedia", RequireAuth(["registered", "premium"]), async(req,res) => {
    const i_id = req.query["i_id"];

    try{
        const data = await pool.query(
            `SELECT ap.*
             FROM activity_photo ap
             JOIN activity a on ap.activity_id = a.activity_id
             WHERE a.itinerary_id = $1`, [i_id]
        );
        if(data.rowCount > 0) {
          const updatedData = await ExtractPhotoS3(data.rows)
          return res.send(updatedData);
        }
        else {return res.send([]);}
    }
    catch(err) {return res.status(500).send({message: "Get activity media failed"});}
});

router.post("/InsertMedia", RequireAuth(["registered", "premium"]), InsertPhoto(), async(req,res) => {
    const {a_id, photoTitle, lng, lat} = req.body;

    // 1. Geotag photos
    for (const file of req.files){
      const filePath = path.join(__dirname, "../uploads", file.filename)
      try{ await Geotag(filePath, lng, lat); }
      catch(err) { console.log("failed to geotag"); } 
      fs.unlink((filePath + "_original"), (err) => {
      if(err) console.log("failed to remove from uploads", err)
    });
    }

    // 2. Store photo in S3
    const s3URL = await ImportPhotoS3();

    if(s3URL){
      // 3. Prepare photo content for upload in db
      const photoRecRaw = s3URL.map(file => [photoTitle, file, lng, lat, a_id]);
      const photoParams = s3URL.map((_,i) => {
        const counter = i*5;
        return(`($${counter+1}, $${counter+2}, $${counter+3}, $${counter+4}, $${counter+5})`);
      }).join(", ");
      const photoRec = photoRecRaw.flat();

      // 4. Upload photo content in db
      try{
        const data = await pool.query(
        `INSERT INTO activity_photo (photo_title, photo_url, longitude, latitude, activity_id)
        VALUES ${photoParams}
        RETURNING *`, photoRec
        );
        if(data.rowCount > 0) {
          const updatedData = await ExtractPhotoS3(data.rows)
          return res.send(updatedData);
        }
      }
      catch(err){
        console.log(err);
        return res.status(500).send("Error inserting photos");
      }
    }
    else{return res.status(500).send("Failed to save photo in S3");}
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
  
  // 3. Delete photo in db
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

router.patch("/EditPhoto", RequireAuth(["registered", "premium"]), async(req, res) => {
  const {p_id, title} = req.body;

  try{
    const data = await pool.query(
      `UPDATE activity_photo
       SET photo_title = $1
       WHERE photo_id = $2`, [title, p_id]
    );
    if(data.rowCount > 0 ) { return res.send(true); }
  }
  catch(err) { return res.status(500).send("edit failed") }

});


module.exports = router