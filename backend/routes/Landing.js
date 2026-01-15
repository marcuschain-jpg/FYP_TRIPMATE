const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const RequireAuths = require("../middlewares/RequireAuths");
const { ExtractPhotoS3 } = require('../helper/S3FileSys.js');
const { ReadStream } = require("fs");


router.get('/GetHome', RequireAuths(["registered", "premium"]), async(req, res) => {
    userid = req.userid;

    try{
        const data = await pool.query(
            `SELECT first_name
             FROM users
             WHERE userid = $1`, [userid]
        );
        res.send(data.rows);
    }
    catch(err){
        res.status(500).send("Error retrieving user info");
    }
});

router.get("/LoadLanding", async(req,res) => {
    try{
        const rawdata = await pool.query(
            `SELECT content_id, c_section, c_title, c_content, c_img_url
             FROM marketing_content
             ORDER BY random()
             LIMIT 3`
        );
        const data = rawdata.rows.map(({c_img_url, ...rest}) => ({
            ...rest,
            photo_url: c_img_url
        }));
        if(data.length > 0) {
          const updatedData = await ExtractPhotoS3(data)
          return res.send(updatedData);
        }
        else {return res.send([]);}
    }
    catch(err){ console.log(err); res.status(500).send({message: "Error receiving details to load landing page"})}
});

router.get("/LoadReviews", async(req,res) => {
    try{
        const [premUserRev, normUserRev] = await Promise.all([
             pool.query(
            `SELECT r.review_id, r.r_content, r.r_rating, u.type, u.first_name, u.last_name,
             TO_CHAR(r.createdat, 'YYYY-MM-DD') as createdat
             FROM review r
             JOIN users u ON r.userid = u.userid
             WHERE u.type = 'premium' AND r_rating > 3
             ORDER BY random()
             LIMIT 3`
            ),
            pool.query(
            `SELECT r.review_id, r.r_content, r.r_rating, u.type, u.first_name, u.last_name,
             TO_CHAR(r.createdat, 'YYYY-MM-DD') as createdat
             FROM review r
             JOIN users u ON r.userid = u.userid
             WHERE u.type = 'registered' AND r_rating > 3
             ORDER BY random()
             LIMIT 3`
            )
        ]);
        const cPremUserRev = premUserRev.rows.map(item => ({
            id: item.review_id,
            name: `${item.first_name} ${item.last_name}`,
            rating: item.r_rating,
            timeAgo: item.createdat,
            text: item.r_content,
            isPremium: true
        }));
        const cNormUserRev = normUserRev.rows.map(item => ({
            id: item.review_id,
            name: `${item.first_name} ${item.last_name}`,
            rating: item.r_rating,
            timeAgo: item.createdat,
            text: item.r_content,
            isPremium: false
        }));
        const allReviews = [...cPremUserRev, ...cNormUserRev];
        res.send(allReviews);
    }
    catch(err) {console.log(err); res.status(500).send({message: "Failed to load reviews"})}
});
module.exports = router;