const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");


router.get('/Login', async (req, res) => {
    const email = req.query["email"];
    const password = req.query["password"];
    const role = req.query["role"];
    let chkRole = false;
    
    try{
        // Check if email exist or role is correct
        const userData = await pool.query(
        `SELECT userid, email, password, type
         FROM users
         WHERE email = $1`, [email]
        );
        
        if(userData.rowCount === 0) 
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
                if(data.rowCount === 0) 
                {
                    res.send({check: false, message: "Wrong Password"});
                }
                else if(data.rowCount === 1 && chkRole)
                {
                    res.send({check: true, userid: userData.rows[0].userid});
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

module.exports = router;