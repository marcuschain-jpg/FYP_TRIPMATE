const express = require("express");
const router = express.Router();


router.get('/printConsole', (req, res) => {
    res.send('welcome to backend');
});

module.exports = router;