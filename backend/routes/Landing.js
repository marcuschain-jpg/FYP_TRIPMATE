const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const RequireAuths = require("../middlewares/RequireAuths");


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

module.exports = router;