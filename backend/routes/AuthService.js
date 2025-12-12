const express = require("express");
const router = express.Router();
const supabase = require("../helper/db.js")

router.get("/findUser", async(req, res)=>{
    const email = req.query["userid"];
    const password = req.query["password"];

    let usernameChk = false;
    let passwordChk = false;

    // Check username
    const{data, error} = await supabase
    .from("user")
    .select("email")
    .eq("email", email);
    
    if(data.email) usernameChk = true;
    else
    {
        //return account dont exist
    }

    if(usernameChk)
    {
        // Check password
        const {data, error} = await supabase
        .from("user")
        .select("password")
        .eq("email", email)
        .eq("password", password);

        if(data.email && data.password) passwordChk = true;
    }
    else
    {
        //return wrong password
    }

    // return user id if pass validation
    if(usernameChk && passwordChk)
    {
        const {data, error} = await supabase
        .from("user")
        .select("userid")
        .eq("email", email)
        .eq("password", password);

        if(error) return res.status(500).send("failed login")
        res.send(data);
    }
    

});


module.exports = router;