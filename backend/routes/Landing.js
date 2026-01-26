const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const RequireAuths = require("../middlewares/RequireAuths");
const { ExtractPhotoS3 } = require('../helper/S3FileSys.js');
const { ReadStream } = require("fs");
const TranslateFunc = require('../helper/Translate.js');


router.get('/GetHome', RequireAuths(["registered", "premium"]), async(req, res) => {
    userid = req.userid;

    try{
        const data = await pool.query(
            `SELECT first_name
             FROM users
             WHERE userid = $1`, [userid]
        );
        res.send(data.rows);
    }
    catch(err){
        res.status(500).send("Error retrieving user info");
    }
});

router.get("/LoadLanding", async(req,res) => {
    const langChanged = req.query['lang'];
    if(langChanged !== "en"){
        try{
            const rawdata = await pool.query(
                `SELECT content_id, c_title, c_content, c_img_url
                FROM marketing_content
                ORDER BY random()
                LIMIT 3`
            );
            const data = rawdata.rows.map(({c_img_url, ...rest}) => ({
                ...rest,
                photo_url: c_img_url
            }));
            if(data.length > 0) {
            const updatedData = await ExtractPhotoS3(data)
            translatedData = await TranslateFunc("content_id", updatedData, langChanged);
            return res.send(translatedData);
            }
            else {return res.send([]);}
        }
        catch(err){ console.log(err); res.status(500).send({message: "Error receiving details to load landing page"})}
    }
    else{
        try{
            const rawdata = await pool.query(
                `SELECT content_id, c_title, c_content, c_img_url
                FROM marketing_content
                ORDER BY random()
                LIMIT 3`
            );
            const data = rawdata.rows.map(({c_img_url, ...rest}) => ({
                ...rest,
                photo_url: c_img_url
            }));
            if(data.length > 0) {
            const updatedData = await ExtractPhotoS3(data)
            return res.send(updatedData);
            }
            else {return res.send([]);}
        }
        catch(err){ console.log(err); res.status(500).send({message: "Error receiving details to load landing page"})}
    }
});

router.get("/ReloadLanding", async(req,res) => {
    const langChanged = req.query['lang'];
    const rawIDNums = req.query['idNums'];
    let idNums;
    if(rawIDNums) idNums = JSON.parse(rawIDNums);
    if(langChanged !== "en" && idNums){
        const dynamicWhere = await idNums.map((i, idx) =>`content_id = $${idx+1}`).join(' OR ');
        const dynamicParams = await idNums.map(i => i.id);
        try{
            const content = await pool.query(
                `SELECT content_id, c_title as title, c_content AS description
                 FROM marketing_content
                 WHERE ${dynamicWhere}`, dynamicParams
            )
            translatedData = await TranslateFunc("content_id", content.rows, langChanged);
            return res.send(translatedData);
        }
        catch(err) {console.log(err);}
    }
    else if(langChanged === "en" && idNums){
        const dynamicWhere = await idNums.map((i, idx) =>`content_id = $${idx+1}`).join(' OR ');
        const dynamicParams = await idNums.map(i => i.id);
        try{
            const content = await pool.query(
                `SELECT content_id, c_title as title, c_content AS description
                 FROM marketing_content
                 WHERE ${dynamicWhere}`, dynamicParams
            )
            return res.send(content.rows);
        }
        catch(err) {console.log(err);}
    }
});


router.get("/LoadReviews", async(req,res) => {
    const langChanged = req.query['lang'];
    if(langChanged !== "en"){
        try{
            const [premUserRev, normUserRev] = await Promise.all([
                pool.query(
                `SELECT r.review_id, r.r_content, r.r_rating, u.type, u.first_name, u.last_name,
                TO_CHAR(r.createdat, 'YYYY-MM-DD') as createdat
                FROM review r
                JOIN users u ON r.userid = u.userid
                WHERE u.type = 'premium' AND r_rating > 3
                ORDER BY random()
                LIMIT 3`
                ),
                pool.query(
                `SELECT r.review_id, r.r_content, r.r_rating, u.type, u.first_name, u.last_name,
                TO_CHAR(r.createdat, 'YYYY-MM-DD') as createdat
                FROM review r
                JOIN users u ON r.userid = u.userid
                WHERE u.type = 'registered' AND r_rating > 3
                ORDER BY random()
                LIMIT 3`
                )
            ]);
            const cPremUserRev = premUserRev.rows.map(item => ({
                id: item.review_id,
                name: `${item.first_name} ${item.last_name}`,
                rating: item.r_rating,
                timeAgo: item.createdat,
                text: item.r_content,
                isPremium: true
            }));
            const cNormUserRev = normUserRev.rows.map(item => ({
                id: item.review_id,
                name: `${item.first_name} ${item.last_name}`,
                rating: item.r_rating,
                timeAgo: item.createdat,
                text: item.r_content,
                isPremium: false
            }));
            const allReviews = [...cPremUserRev, ...cNormUserRev];
            const toBeTranslated = allReviews.map(i => ({
                review_id: i.id,
                text: i.text,
            }))
            translatedData = await TranslateFunc("review_id", toBeTranslated, langChanged);
            const updatesMap = new Map(translatedData.map(item => [item.review_id, item]));
            const finalReviews = allReviews.map(item => {
                if(updatesMap.has(item.id)){
                    return {...item, ...updatesMap.get(item.id)}
                }
                return item;
            });
            res.send(finalReviews);
        }
        catch(err) {console.log(err); res.status(500).send({message: "Failed to load reviews"})}
    }
    else{
        try{
            const [premUserRev, normUserRev] = await Promise.all([
                pool.query(
                `SELECT r.review_id, r.r_content, r.r_rating, u.type, u.first_name, u.last_name,
                TO_CHAR(r.createdat, 'YYYY-MM-DD') as createdat
                FROM review r
                JOIN users u ON r.userid = u.userid
                WHERE u.type = 'premium' AND r_rating > 3
                ORDER BY random()
                LIMIT 3`
                ),
                pool.query(
                `SELECT r.review_id, r.r_content, r.r_rating, u.type, u.first_name, u.last_name,
                TO_CHAR(r.createdat, 'YYYY-MM-DD') as createdat
                FROM review r
                JOIN users u ON r.userid = u.userid
                WHERE u.type = 'registered' AND r_rating > 3
                ORDER BY random()
                LIMIT 3`
                )
            ]);
            const cPremUserRev = premUserRev.rows.map(item => ({
                id: item.review_id,
                name: `${item.first_name} ${item.last_name}`,
                rating: item.r_rating,
                timeAgo: item.createdat,
                text: item.r_content,
                isPremium: true
            }));
            const cNormUserRev = normUserRev.rows.map(item => ({
                id: item.review_id,
                name: `${item.first_name} ${item.last_name}`,
                rating: item.r_rating,
                timeAgo: item.createdat,
                text: item.r_content,
                isPremium: false
            }));
            const allReviews = [...cPremUserRev, ...cNormUserRev];
            res.send(allReviews);
        }
        catch(err) {console.log(err); res.status(500).send({message: "Failed to load reviews"})}
    }
});

router.get("/ReloadReviews", async(req,res) => {
    const langChanged = req.query['lang'];
    const rawIDNums = req.query['idNums'];
    let idNums;
    if(rawIDNums) idNums = JSON.parse(rawIDNums);
    if(langChanged !== "en" && idNums){
        const dynamicWhere = await idNums.map((i, idx) =>`review_id = $${idx+1}`).join(' OR ');
        const dynamicParams = await idNums.map(i => i.id);
        try{
            const content = await pool.query(
                `SELECT review_id, r_content AS text
                 FROM review
                 WHERE ${dynamicWhere}`, dynamicParams
            )
            translatedData = await TranslateFunc("review_id", content.rows, langChanged);
            return res.send(translatedData);
        }
        catch(err) {console.log(err);}
    }
    else if(langChanged === "en" && idNums){
        const dynamicWhere = await idNums.map((i, idx) =>`review_id = $${idx+1}`).join(' OR ');
        const dynamicParams = await idNums.map(i => i.id);
        try{
            const content = await pool.query(
                `SELECT review_id, r_content AS text
                 FROM review
                 WHERE ${dynamicWhere}`, dynamicParams
            )
            return res.send(content.rows);
        }
        catch(err) {console.log(err);}
    }
});
module.exports = router;