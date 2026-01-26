const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const RequireAuth = require("../middlewares/RequireAuths.js"); 

router.get("/LoadUsernav", RequireAuth(["registered", "premium"]), async(req,res) => {
    const userid = req.userid;

    try{
        const data = await pool.query(
            `SELECT preferred_lang FROM users WHERE userid=$1`, [userid]
        )
        return res.send(data.rows[0].preferred_lang);
    }
    catch(err) {console.log(err); return res.status(500).send({ message:"Failed to get user preferred locale" });}
});

router.patch("/ChangeLang", RequireAuth(["registered", "premium"]), async(req,res) => {
    const { lng } = req.body;
    const userid = req.userid;

    try{
        const data = await pool.query(
            `UPDATE users SET preferred_lang=$1 WHERE userid = $2`, [lng, userid]
        );
        if(data.rowCount > 0) return res.send(true);
        else return res.send(false);
    }
    catch(err) {console.log(err); return res.status(500).send({ message: "Failed to update preferred language" });}
});

module.exports = router;