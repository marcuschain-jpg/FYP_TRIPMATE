const express = require("express");
const {exiftool} = require("exiftool-vendored"); // photo geotag

async function Geotag(filePath, lng, lat){
    await exiftool.write(filePath,{
        GPSLatitude: lat,
        GPSLongitude: lng,
        GPSLatitudeRef: lat >= 0 ? "N" : "S",
        GPSLongitudeRef: lng >=0 ? "E" : "W"
    });
}
        

module.exports = Geotag;