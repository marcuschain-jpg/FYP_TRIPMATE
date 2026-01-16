const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const RequireAuths = require('../middlewares/RequireAuths.js');
const { ExtractPhotoS3, ImportPhotoS3, DeletePhotoS3 } = require("../helper/S3FileSys.js");
const InsertPhoto = require("../middlewares/PhotoImp.js");

router.get("/GetProfileDetails", RequireAuths(["registered", "premium"]), async(req,res) => {
  const userid = req.userid;

  try{
    const data = await pool.query(
      `SELECT email, bio, type, avatar, first_name, last_name
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
  const {email, firstname, lastname, bio, password} = req.body;
  const userid = req.userid;
  let havePhoto = false;
  const uploadSessionID = req.uploadSessionID;
  let updateComplete = false;
  let oldPhotoURL = "";

  if(req.files && req.files.length > 0) havePhoto = true;

  if(havePhoto){
    try{
    const data = await pool.query(`
      SELECT avatar FROM users WHERE userid = $1
      `, [userid]);
    if(data.rowCount > 0) oldPhotoURL = data.rows[0].avatar;
    else oldPhotoURL = ""
    }
    catch(err) {oldPhotoURL="";}
  }

  if(password){
    try{
    const data = await pool.query(`
      SELECT password FROM users WHERE userid = $1
      `, [userid]);
    if(data.rows[0].password === password) return res.send({validateErr: true, message: "New password cannot be the same as your previous password"});
    }
    catch(err) {return res.status(500).send({message:"Failed to retrieve password for validation"})}
  }


  await pool.query("BEGIN")
  try{
    if(havePhoto){
      const s3URL = await ImportPhotoS3("avatar", uploadSessionID);
      await pool.query(
        `UPDATE users
        SET avatar = $1
        WHERE userid = $2`, [s3URL[0], userid]
      );
    }
    if(password){
      await pool.query(
        `UPDATE users
        SET password = $1
        WHERE userid = $2`, [password, userid]
      );
    }
    const data = await pool.query(
      `UPDATE users
      SET email = $1, bio = $2, first_name = $3, last_name = $4
      WHERE userid = $5`, [email, bio, firstname, lastname, userid]
    );
    await pool.query("COMMIT");
    updateComplete = true;
  }
  catch(err) {
    await pool.query("ROLLBACK");
    await DeletePhotoS3(s3URL[0]);
    console.log(err);
    res.status(500).send({message: "Failed to update account type"});
  }

  //Delete old avatar from s3 and return true
  if(oldPhotoURL !== ""){
    await DeletePhotoS3(oldPhotoURL);
  }

  if(updateComplete) res.send(true);
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

