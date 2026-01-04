const express = require("express");
const router = express.Router();
// --- DB stuff ---
const pool = require("../helper/db.js");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js");

router.get("/GetPhotoTimeline", RequireAuth(["registered", "premium"]), async(req,res) => {
    const i_id = req.query["i_id"]

    try{
        const data = await pool.query(
            `SELECT a.activity_id, a.activity_name, ap.photo_id, ap.photo_title, ap.photo_url,
             TO_CHAR(a.activity_date, 'YYYY-MM-DD') AS activity_date
             FROM activity a
             LEFT JOIN activity_photo ap ON a.activity_id = ap.activity_id
             RIGHT JOIN itinerary i ON a.itinerary_id = i.itinerary_id
             WHERE i.itinerary_id = $1`, [i_id]
        );
        return res.send(data.rows);
    }
    catch(err){
        return res.status(500).send({message: "get timeline photos failed"})
    }
    
});

router.post("/SaveTimeline", RequireAuth(["registered", "premium"]), async(req,res) => {
    const {i_id, name, timeline_photos} = req.body;
    let insertTimeline = false;
    let timeline_id = null;

    // 1. Insert itinerary data in DB
    try{
        const data = await pool.query(
        `INSERT INTO timeline (timeline_name, itinerary_id)
         VALUES ($1, $2)
         RETURNING timeline_id`, [name, i_id]
        );
        if(data.rowCount > 0) {
            insertTimeline = true;
            timeline_id = data.rows[0].timeline_id
        }
    }
    catch(err) {return res.status(500).send({message: "Insert into timeline failed"});}

    // 2. Insert array of timeline_photos into DB

    // Dynamically create placeholder and its params
    const timelinePhotoRecRaw = timeline_photos.map(photo => [timeline_id, photo.mediaId, photo.x, photo.y]);
    const timelinePhotoParams = timeline_photos.map((_,i) => {
        const counter = i*4;
        return(`($${counter+1}, $${counter+2}, $${counter+3}, $${counter+4})`);
    }).join(", ");
    const timelinePhotoRec = timelinePhotoRecRaw.flat();
    
    try{
        const data = await pool.query(
        `INSERT INTO timeline_photo (timeline_id, photo_id, x_coord, y_coord)
         VALUES ${timelinePhotoParams}`, timelinePhotoRec
        );
        if(data.rowCount > 0 && insertTimeline) res.send(true);
    }
    catch(err){return res.status(500).send({message: "Insert into timeline_photo failed"});}

    
});


router.get("/GetSavedTimelines", RequireAuth(["registered", "premium"]), async(req,res) => {
    const i_id = req.query["i_id"]

    try{
       const data = await pool.query(
        `SELECT t.timeline_id, t.timeline_name, tp.photo_id,
         ap.photo_title, ap.photo_url, tp.x_coord, tp.y_coord,
         TO_CHAR(a.activity_date, 'YYYY-MM-DD') AS activity_date
         FROM timeline t
         JOIN itinerary i ON t.itinerary_id = i.itinerary_id
         JOIN timeline_photo tp ON t.timeline_id = tp. timeline_id
         JOIN activity_photo ap ON tp.photo_id = ap.photo_id
         JOIN activity a ON ap.activity_id = a.activity_id
         where t.itinerary_id = $1`, [i_id]
       );
       if(data.rowCount > 0) return res.send(data.rows);
    }
    catch(err) {return res.status(500).send({message: "GetSavedTimelines failed"})}
});

router.delete("/DeleteSavedTimeline", RequireAuth(["registered", "premium"]), async(req,res) => {
    const {t_id} = req.body;

    try{
    const data = await pool.query(
      `DELETE FROM timeline
       WHERE timeline_id = $1`, [t_id]
    );
    if(data.rowCount > 0)
    {
      return res.send(true)
    }
  }
  catch(err){
    return res.status(500).send("Error deleting photos from db");
  }
})


module.exports = router;