const express = require("express");
const router = express.Router();
// --- DB stuff ---
const pool = require("../helper/db.js");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js");

router.post("/InsertPhotoMedia", RequireAuth(["registered", "premium"]), async(req,res) => {
    console.log("reached");
});


module.exports = router