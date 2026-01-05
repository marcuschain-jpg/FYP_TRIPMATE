const express = require('express');
const AWS = require('aws-sdk');
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWSKEY,
    region: "ap-southeast-2",
    secretAccessKey: process.env.AWSSECRETKEY
});
const myBucket = process.env.AWSBUCKET

async function ExtractPhotoS3(data){
    const newData = data.map(d => {
        if(d.photo_url === null){
            return{...d, photo_url: null};
        }
        const myKey = d.photo_url;
        const signedURLExpire = 30 * 60 * 1 // 30 mins
        
        const signedURL = s3.getSignedUrl('getObject', {
            Bucket: myBucket,
            Key: myKey,
            Expires: signedURLExpire
        });
        return{...d, photo_url: signedURL};
    })  
    return newData;
};

async function ImportPhotoS3(){
    const filePath = path.join(__dirname, "../uploads");
    const files = await fs.promises.readdir(filePath)
    if(files.length === 0){
        console.log("no files to be read")
        return;
    }
    const output = await Promise.all(files.map(async (file) => {
        const FP = path.join(__dirname,"../uploads",file);
        const FPS3 = path.join("storage", file);
        const fileStream = fs.createReadStream(FP);
        const uploadParams = {
            Bucket: myBucket,
            Key: FPS3,
            Body: fileStream
        }
        const data = await s3.upload(uploadParams).promise();
        fs.unlink((FP), (err) => {
            if(err) console.log("failed to remove from storage", err)
        });
        return data.Key;
    }));
    if(output) {
        return output;
    }
}

async function DeletePhotoS3(file){
    const deleteParams = {
        Bucket: myBucket,
        Key: file
    }
    const output = await s3.deleteObject(deleteParams).promise();

    if(output) return true;
}

module.exports = {ExtractPhotoS3, ImportPhotoS3, DeletePhotoS3};