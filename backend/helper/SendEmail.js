const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });

async function SendEmail(content){

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAILPW
        }
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: content.recipient,
        subject: content.subject,
        text: content.text,
        html: content.html,
    };

    try{
        await transporter.sendMail(mailOptions);
        return true;
    }
    catch(err){
        console.error("Email failed", err);
        return false;
    }
};

module.exports = SendEmail;