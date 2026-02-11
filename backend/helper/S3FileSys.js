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
        else if(d.vid_url === null){
            return{...d, photo_url: null};
        }
        let myKey = d.photo_url;
        if(d.vid_url){
            myKey = d.vid_url;
        }
        const signedURLExpire = 30 * 60 * 1 // 30 mins
        
        const signedURL = s3.getSignedUrl('getObject', {
            Bucket: myBucket,
            Key: myKey,
            Expires: signedURLExpire
        });
        if(d.vid_url) return {...d, vid_url: signedURL}
        else return{...d, photo_url: signedURL};
    })  
    return newData;
};

async function ImportPhotoS3(loc, uploadSessionID){
    const filePath = path.join(__dirname, "../uploads");
    const rawfiles = await fs.promises.readdir(filePath)
    const files = rawfiles.filter(file => 
        file.startsWith(`${uploadSessionID}`) && !file.includes("_original")
    );

    if(files.length === 0){
        console.log("no files to be read")
        return;
    }
    const output = await Promise.all(files
        .map(async (file) => {
        const FP = path.join(__dirname,"../uploads",file);
        const FPS3 = `${loc}/${file}`;
        const fileStream = fs.createReadStream(FP);
        const uploadParams = {
            Bucket: myBucket,
            Key: FPS3,
            Body: fileStream
        }
        try{
            const data = await s3.upload(uploadParams).promise();
            await fs.promises.unlink((FP), (err) => {
                if(err) console.log("failed to remove from storage", err)
            });
            return data.Key;
        }
        catch(err) {console.log('failed to upload to s3', err)}
    }));
    if(output) {
        return output;
    }
}

async function DeletePhotoS3(file){
    try {const deleteParams = {
        Bucket: myBucket,
        Key: file
    }
    const output = await s3.deleteObject(deleteParams).promise();

    if(output) return true;
    }
    catch(err) {console.log("delete from s3 error: ", err)}
}

module.exports = {ExtractPhotoS3, ImportPhotoS3, DeletePhotoS3};