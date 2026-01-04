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

router.get("/GetActivityMedia", RequireAuth(["registered", "premium"]), async(req,res) => {
    const i_id = req.query["i_id"];

    try{
        const data = await pool.query(
            `SELECT ap.* 
             FROM activity_photo ap
             JOIN activity a on ap.activity_id = a.activity_id
             WHERE a.itinerary_id = $1`, [i_id]
        );
        if(data.rowCount > 0) {return res.send(data.rows);}
        else {return res.send([]);}
    }
    catch(err) {return res.status(500).send({message: "Get activity media failed"});}
});

router.post("/InsertMedia", RequireAuth(["registered", "premium"]), InsertPhoto(), async(req,res) => {
    const {a_id, photoTitle, lng, lat} = req.body;

    for (const file of req.files){
      const filePath = path.join(__dirname, "../../storage", file.filename)
      try{ await Geotag(filePath, lng, lat); }
      catch(err) { console.log("failed to geotag"); } 
      fs.unlink((filePath + "_original"), (err) => {
      if(err) console.log("failed to remove from storage", err)
    });
    }

    // Prepare photo content for upload in db
    const photoRecRaw = req.files.map(file => [photoTitle, `http://localhost:8080/images/${file.filename}`, lng, lat, a_id]);
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
      RETURNING *`, photoRec
      );
      if(data.rowCount > 0) //successfully update
      {
        return res.send(data.rows);
      }
    }
    catch(err){
      console.log(err);
      return res.status(500).send("Error inserting photos")
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