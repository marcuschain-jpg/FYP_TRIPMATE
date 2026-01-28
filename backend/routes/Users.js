const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const RequireAuths = require('../middlewares/RequireAuths.js');
const { ExtractPhotoS3, ImportPhotoS3, DeletePhotoS3 } = require("../helper/S3FileSys.js");
const InsertPhoto = require("../middlewares/PhotoImp.js");
const TranslateFunc = require("../helper/Translate.js");

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
  let trips = [];

  // UNSUB > REGISTERED
  if(newType === "registered"){
    try{
      const data = await pool.query(
        `SELECT i.itinerary_id, i.itinerary_name, i.type, i.num_ppl, true AS isHost
        FROM itinerary i
        WHERE i.user_host_id = $1
        UNION
        SELECT i.itinerary_id, i.itinerary_name, i.type, i.num_ppl, false AS isHost
        FROM itinerary i
        JOIN shared_itinerary si ON i.itinerary_id = si.itinerary_id  
        WHERE si.user_id = $1
        UNION
        SELECT i.itinerary_id, i.itinerary_name, i.type, i.num_ppl, false AS isHost
        FROM itinerary i
        JOIN group_trip gt ON i.itinerary_id = gt.itinerary_id
        WHERE gt.user_id = $1 `, [userid]
      );
      trips = data.rows;
      console.log(trips);
    }
    catch(err) {console.log(err);}
    // If trips 1 person > group trips(delete chat, change trip type normal)
    // If trips > 1 person (remove from trip, rehost)
    await pool.query("BEGIN");
    try{
      for(const trip of trips){
        // If 1 person & group trip > set to trip to private & delete chat table
        if(trip.num_ppl === 1 && trip.type === "Group"){
          console.log("Delete group trip & chat!", trip.itinerary_name);
          await pool.query(`UPDATE itinerary SET type = 'Private' WHERE itinerary_id = $1`, [trip.itinerary_id]);
          await pool.query(`DELETE FROM chat_room WHERE itinerary_id = $1`, [trip.itinerary_id])
        }
        else if(trip.num_ppl > 1 && trip.type === "Private"){
          if(trip.ishost){
            console.log("Private and isHost!", trip.itinerary_name);
            await pool.query(
            `WITH selectrandom AS(
              SELECT user_id
              FROM shared_itinerary
              WHERE itinerary_id=$1
              ORDER BY random()
              LIMIT 1
              ),
              transferhost AS(
              DELETE FROM shared_itinerary
              WHERE itinerary_id=$1 AND user_id=(SELECT user_id from selectrandom)
              )
              UPDATE itinerary
              SET user_host_id = (SELECT user_id from selectrandom),
              num_ppl = $2
              WHERE itinerary_id = $1`, [trip.itinerary_id, trip.num_ppl - 1]
            );
          }
          else{
            console.log("Private and isNotHost!", trip.itinerary_name);
            await pool.query(
              `WITH deleteuser AS(
              DELETE FROM shared_itinerary
              WHERE itinerary_id=$1 AND user_id=$2
              )
              UPDATE itinerary
              SET num_ppl = $3
              WHERE itinerary_id=$1`, [trip.itinerary_id, userid, trip.num_ppl-1]
            );
          }
        }
        else if(trip.num_ppl > 1 && trip.type === "Group"){
          if(trip.ishost){
            console.log("Group and isHost!", trip.itinerary_name);
            await pool.query(
              `WITH selectrandom AS(
              SELECT user_id
              FROM group_trip
              WHERE itinerary_id=$1
              ORDER BY random()
              LIMIT 1
              ),
              transferhost AS(
              DELETE FROM group_trip
              WHERE itinerary_id=$1 AND user_id=(SELECT user_id from selectrandom)
              )
              UPDATE itinerary
              SET user_host_id = (SELECT user_id from selectrandom),
              num_ppl = $2
              WHERE itinerary_id = $1`, [trip.itinerary_id, trip.num_ppl - 1]
              );
          }
          else{
            console.log("Group and isNotHost!", trip.itinerary_name);
            await pool.query(
              `WITH deleteuser AS(
              DELETE FROM group_trip
              WHERE itinerary_id=$1 AND user_id=$2
              )
              UPDATE itinerary
              SET num_ppl = $3
              WHERE itinerary_id = $1`, [trip.itinerary_id, userid, trip.num_ppl-1]
            );
          }
        }
      }
      // Finally Change user type
      await pool.query(
        `UPDATE users
         SET type = $2
         WHERE userid = $1`, [userid, newType]
      );
      await pool.query("COMMIT")
    }
    catch(err) {
      await pool.query("ROLLBACK")
      console.log(err);
      return res.send(500).send({ message: "Failed to downgrade user" });
    }
    return res.send(true);
  }

  // SUBSCRIBE > PREMIUM
  else if(newType === "premium"){
    try{
    const data = await pool.query(
      `UPDATE users
       SET type = $2
       WHERE userid = $1`, [userid, newType]
    );
    return res.send(true);
    }
    catch(err) {console.log(err); res.status(500).send({ message: "Failed to update account type" });}
  }
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

router.get("/GetFAQ", RequireAuths(["registered", "premium"]), async(req,res) => {
  const langChanged = req.query['lang'];

  try{
    const data = await pool.query(
      `SELECT faq_id AS id, faq_question AS question, faq_answer AS answer
       FROM faq`
    )
    if(langChanged!=="en"){
      translatedData = await TranslateFunc("faq_id", data.rows, langChanged);
      return res.send(translatedData);
    }
    else return res.send(data.rows)
  }
  catch(err) {console.log(err); return res.status(500).send("Error retrieving FAQ")}
});

module.exports = router;

