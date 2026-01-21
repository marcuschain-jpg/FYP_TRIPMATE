const express = require("express");
const pool = require("../helper/db.js");
const { Translate } = require("@google-cloud/translate").v2;
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });

async function TranslateFunc(idName, content, lang){
    const translate = new Translate({ key: process.env.gMapsApiKey })
    const result = await Promise.all(
        content.map(async(item) => {
            const idValue = item[idName];
            const translatedEntries = Object.entries(item)
            .filter(([key, value]) => (key === idName || typeof value === "string") && key !== "image" && key !== "photo_url")
            .map(async ([key, value]) => {
                if(key !== idName){
                    try{
                        const res = await pool.query(`SELECT text_aft FROM translation
                            WHERE ${idName} = $1 AND text_bef=$2 AND lang_aft=$3`, [idValue, value, lang]);
                        if(res.rowCount === 0){
                            const text = value;
                            const target = lang;
                            const [translation] = await translate.translate(text,target)
                            try{
                                const res2 = await pool.query(`INSERT INTO translation(text_bef, text_aft, lang_bef, lang_aft, ${idName})
                                                               VALUES($1,$2,$3,$4,$5)
                                                                RETURNING text_aft`, [text, translation, "en", target, idValue]);
                                item[key] = res2.rows[0].text_aft;
                            }
                            catch(err) {console.log(err);}
                        }
                        else{
                            item[key] = res.rows[0].text_aft;
                        }
                    }
                    catch(err) {console.log(err);}
                }
            })
            await Promise.all(translatedEntries);
            return item;
        })
    )
    return result;
}

module.exports = TranslateFunc;
