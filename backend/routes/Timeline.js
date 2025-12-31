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

module.exports = router;