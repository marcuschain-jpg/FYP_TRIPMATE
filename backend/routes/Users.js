const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const RequireAuths = require('../middlewares/RequireAuths.js');
const { ExtractPhotoS3, ImportPhotoS3 } = require("../helper/S3FileSys.js");
const InsertPhoto = require("../middlewares/PhotoImp.js");

router.get("/GetProfileDetails", RequireAuths(["registered", "premium"]), async(req,res) => {
  const userid = req.userid;

  try{
    const data = await pool.query(
      `SELECT email, bio, type, avatar
       FROM users
       WHERE userid = $1`, [userid]
    );
    const dataCleaned = data.rows.map(({avatar, ...rest}) => ({
      ...rest,
      photo_url: avatar
    }));
    if(dataCleaned[0].photo_url !== null) {
      const updatedData = await ExtractPhotoS3(dataCleaned);
      return res.send(updatedData);
    }
    else return res.send(dataCleaned);
  }
  catch(err) {console.log(err); res.status(500).send({message: "Failed to get profile details"});}
});

router.patch("/UserChangeType", RequireAuths(["registered", "premium"]), async(req,res) => {
  const {newType} = req.body;
  const userid = req.userid;

  // To edit again what happen if unsub
  try{
    const data = await pool.query(
      `UPDATE users
       SET type = $2
       WHERE userid = $1`, [userid, newType]
    );
  }
  catch(err) {console.log(err); res.status(500).send({message: "Failed to update account type"});}
});

router.patch("/UpdateUserProfile", RequireAuths(["registered", "premium"]), InsertPhoto(), async(req,res) => {
  const {email, bio} = req.body;
  const userid = req.userid;
  let havePhoto = false;
  const uploadSessionID = req.uploadSessionID;

  // Delete previous photo form s3?

  if(req.files.length > 0) havePhoto = true;

  // if have photo
  if(havePhoto){
    const s3URL = await ImportPhotoS3("avatar", uploadSessionID);
    try{
      const data = await pool.query(
        `UPDATE users
        SET email = $1, bio = $2, avatar = $3
        WHERE userid = $4`, [email, bio, s3URL[0], userid]
      );
    }
    catch(err) {console.log(err); res.status(500).send({message: "Failed to update account type"});}
  }

  // if no photo  
  else{
    try{
      const data = await pool.query(
        `UPDATE users
        SET email = $1, bio = $2
        WHERE userid = $3`, [email, bio, userid]
      );
    }
    catch(err) {console.log(err); res.status(500).send({message: "Failed to update account type"});}
  }

  return res.send(true);

});


router.post("/SubmitReview", RequireAuths(["registered","premium"]), async(req,res) => {
  const{content, rating} = req.body;
  const userid = req.userid;

  try{
    const data = await pool.query(
      `INSERT INTO review(userid, r_content, r_rating)
       VALUES($1, $2, $3)`, [userid, content, rating]
    );
    if(data.rowCount > 0) return res.send(true);
  }
  catch(err) {console.log(err); res.status(500).send({message: "Failed to submit review"});}
});

router.post("/SubmitTicket", RequireAuths(["registered", "premium"]), async(req,res) => {
  const{category, title, contents} = req.body;
  const userid = req.userid

  try{
    const data = await pool.query(
      `INSERT INTO support_ticket(userid, title, contents, category)
       VALUES ($1,$2,$3,$4)`, [userid,title,contents,category]
    );
    if(data.rowCount > 0) return res.send(true);
  }
  catch(err) {console.log(err); res.status(500).send({message: "Failed to submit ticket"});}
});

module.exports = router;

