const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });


router.post('/Login', async (req, res) => {
    const {email, password, role} = req.body;
    let chkRole = false;
    
    try{
        // Check if email exist or role is correct
        const userData = await pool.query(
        `SELECT userid, email, password, type
         FROM users
         WHERE email = $1`, [email]
        );
        
        if(userData.rowCount === 0) // no acc in db
        { 
            res.send({check: false, message: "No Account with entered email found"});
        }
        else
        {
            if((userData.rows[0].type === "registered" || userData.rows[0].type === "premium") && role === "user") chkRole = true;
            if(userData.rows[0].type === "admin" && role === "admin") chkRole = true;  
            if(!chkRole) res.send({check: false, message: "No Account with entered email found"});
            else
            {
                // match email and password
                const data = await pool.query(
                    `SELECT userid, email, password, type
                    FROM users
                    WHERE email = $1 AND password = $2`, [email, password]
                );
                if(data.rowCount === 0) // wrong pw
                {
                    res.send({check: false, message: "Wrong Password"});
                }
                else if(data.rowCount === 1 && chkRole) // success
                {
                    userid = userData.rows[0].userid;
                    const jwtSecret = process.env.JWT_SECRET;
                    const token = jwt.sign({userid}, jwtSecret);

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
})

module.exports = router;