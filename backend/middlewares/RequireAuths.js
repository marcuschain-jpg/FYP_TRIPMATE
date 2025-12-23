const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });

const RequireAuths = (req, res, next) => {
    // Extract JWT secret & token
    const jwtSecret = process.env.JWT_SECRET;
    const token = req.cookies['token'];

    // Check if token is present
    if(!token) {
        return res.status(404).send({message: "You must first be logged in"});
    }
    
    try{
        // Verify if token is valid
        const payload = jwt.verify(token, jwtSecret);
        if(payload){
            req.authenticate = true;
            req.userid = payload.userid;
            return next();
        }
    }
    catch(err){
        return res.status(403).json({message: "invalid token"});
    }
};

module.exports = RequireAuths;