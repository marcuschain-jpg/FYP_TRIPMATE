const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const RequireAuths = require('../middlewares/RequireAuths.js');
const { ExtractPhotoS3, ImportPhotoS3 } = require("../helper/S3FileSys.js");
const InsertPhoto = require("../middlewares/PhotoImp.js");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        userid,
        email,
        first_name,
        last_name,
        suspended,
        created_at,
        last_login,
        posts,
        flags
      FROM users
      ORDER BY created_at DESC
    `);

    const users = result.rows.map((u) => ({
      id: u.userid, 
      name: `${u.first_name} ${u.last_name}`,
      email: u.email,
      status: u.suspended ? "Suspended" : "Active",
      dateJoined: u.created_at
        ? u.created_at.toISOString().split("T")[0]
        : "-",
      lastLogin: u.last_login
        ? u.last_login.toISOString().split("T")[0]
        : "-",
      posts: u.posts,
      flags: u.flags,
    }));

    res.json(users);
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }

});

//Suspend Function
router.patch("/:id/suspend", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET suspended = NOT suspended
      WHERE userid = $1
      RETURNING suspended
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      status: result.rows[0].suspended ? "Suspended" : "Active",
    });
  } catch (err) {
    console.error("Suspend user error:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

//Delete Function
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM users WHERE userid = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

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

module.exports = router;

