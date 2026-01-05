const express = require("express");
const path = require("path") // photo path
const multer = require("multer"); // manage and store files

function InsertPhoto(){
    const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads")); // store in storage folder
    },
    filename: (req, file, cb) => {
        const name = `${Math.random().toString(32)}_dateVal_${Date.now().toString(32)}_${file.originalname}`; // e.g., uuid_date_file1.jpg
        cb(null, name);
    },
    });

    const upload = multer({storage});
    return upload.array("media");
}

module.exports = InsertPhoto;