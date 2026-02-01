const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });
const SendEmail = require("../helper/SendEmail.js");


router.post('/Login', async (req, res) => {
    const {email, password, role} = req.body;
    let chkRole = false;
    
    try{    
        // Check if email exist or role is correct
        const userData = await pool.query(
        `SELECT 1, userid, email, password, type
         FROM users
         WHERE email = $1`, [email]
        );
        
        if(userData.rowCount === 0) // no acc in db
        { 
            res.send({check: false, message: "No Account with entered email found"});
        }
        else
        {
            const realRole = userData.rows[0].type;
            if((realRole === "registered" || realRole === "premium") && role === "user") chkRole = true;
            if(realRole === "admin" && role === "admin") chkRole = true;  
            if(!chkRole) res.send({check: false, message: "No Account with entered email found"});
            else
            {
                
                // match email and password
                const data = await pool.query(
                    `SELECT 1, userid, email, password, type
                     FROM users
                     WHERE email = $1 AND password = $2`, [email, password]
                );
                if(data.rowCount === 0) // wrong pw
                {
                    res.send({check: false, message: "Wrong Password"});
                }
                else if(data.rowCount === 1 && chkRole) // success
                {
                    const userid = userData.rows[0].userid;
                    const jwtSecret = process.env.JWT_SECRET;
                    const token = jwt.sign({userid, realRole}, jwtSecret);

                    res.cookie('token', token, {
                        maxAge: 60*60*24*10*1000, // 10 days in ms
                        path: "/",
                        secure: false, // change only when https
                        httpOnly: true,
                        sameSite: 'lax'
                    });

                    res.send({check: true, token});
                }
            }
        }
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error login in")
    } 
});

router.post('/CreateAccount', async(req, res) =>{
    const {email, password, firstname, lastname} = req.body;
    //eventually to hash password

    try{
        data = await pool.query(
            `INSERT INTO users (email, password, first_name, last_name, type)
             VALUES ($1, $2, $3, $4, 'registered');`, [email, password, firstname, lastname]
        );
        //email already exist
        res.send(true)
    }
    catch(err){
        res.send(false)
    }
});

router.post("/Logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: false, // set to true only when https
        sameSite: "Strict"
    })
    res.send({ success: true});
});

router.post("/SendResetEmail", async(req,res) => {
  const { email } = req.body;
  let sentEmail = false;
  const serviceType = "reset password";
  let userid = null;
  let fullname = "";
  let inv_id = null;

  // 1. Retrieve user info with email and validate email
  try{
    const data = await pool.query(
      `SELECT userid, first_name, last_name FROM users WHERE email = $1`, [email]
    )
    if(data.rowCount === 0) return res.status(500).send({message: "No user found with this email"});
    data.rows.forEach(element => {
      fullname = `${element.first_name} ${element.last_name}`;
      userid = element.userid;
    });
  }
  catch(err) {return res.status(500).send({message: "Query Failed"});}

  await pool.query("BEGIN");
  if(userid){
    try{
      await pool.query( // Delete previous password reset request
        `DELETE FROM email_validation
         WHERE servicetype = $1 AND user_id = $2`, [serviceType, userid]
      );

      const data = await pool.query( // Create new email validation request
        `INSERT INTO email_validation(user_id, servicetype)
         VALUES($1, $2)
         RETURNING inv_id`, [userid, serviceType]
      );
      await pool.query("COMMIT");

      if(data.rowCount > 0) inv_id = data.rows[0].inv_id;
    }
    catch(err) {
      await pool.query("ROLLBACK");
      return res.status(500).send({message: "Send validation email failed"});
    }

    const content = {
      recipient: email,
      subject: `Tripmate Password Reset`,
      text: `Reset your password with tripmate!`,
      html: `
      <p>Hi ${fullname}! Below is a link to reset your password for your account with TripMate!</p>
      <p><a href=http://localhost:3000/reset-password/${inv_id}>Click me!</a></p>`
    };
    sentEmail = await SendEmail(content);
    if(!sentEmail) return res.status(500).send({message: "Failed to send email"});
    return res.send(true);
  }
});

router.post("/ValidateToken", async(req,res) => {
    const {token} = req.body;

    try{
        const data = await pool.query(
            `SELECT * FROM email_validation
             WHERE inv_id = $1`, [token]
        );
        if(data.rowCount > 0) return res.send(true)
        else return res.send(false);
    }
    catch(err) {return res.status(500).send({message: "Send validation email failed"});}
});

router.patch("/ResetPassword", async(req,res) => {
    const {token, newPassword} = req.body;
    let userid = null;
    let password = null;

    try{
        const data = await pool.query(`WITH getcredentials AS(
         SELECT user_id FROM email_validation
         WHERE inv_id = $1
        )
         SELECT userid, password FROM users
         WHERE userid = (SELECT user_id from getcredentials)`, [token]
        );
        userid = data.rows[0].userid;
        password = data.rows[0].password;
    }
    catch(err) {console.log(err); return res.status(500).send({message: "Failed get user credentials"});}

    if(newPassword === password) return res.send({check: false, message: "Password cannot be the same as your old password"});

    try{
        const data = await pool.query(`WITH deleteinv AS(
         DELETE FROM email_validation
         WHERE inv_id = $1
        )
         UPDATE users
         SET password = $2
         WHERE userid = $3`, [token, newPassword, userid]
        );
        res.send(true);
    }
    catch(err) {return res.status(500).send({message: "Failed to update password"});}
});


module.exports = router;