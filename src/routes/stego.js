const express = require("express");
const { userAuth } = require("../middlewares/auth");
const uploadImg = require("../middlewares/uploadImg");
const User = require("../models/user");
const embedMsg = require("../../steganography/embedMsg/embedMsg");
const bcrypt = require("bcrypt");
const imgToArray = require("../../steganography/embedMsg/imgToBuffer");
const StegoMsg = require("../models/sendStegoMsg");
const fs = require('fs');
const path = require('path');
const bufferToImg = require("../../steganography/embedMsg/bufferToImg");
const recoverMsg = require("../../steganography/recoverMsg/recoverMsg");

const stegoRouter = express.Router();

stegoRouter.post("/sendStegoMsg",userAuth,uploadImg.single("imgFile"),async(req,res)=>{

    let inputImg = null;  // Declare here
    const outputImgPath = path.join(__dirname, '../imgUploads/outputImg/outputImg.jpg');

    try {
        const fromUserId = req.user._id;
        const {toUserEmail ,stegoKey,stegoMsg} = req.body;

        if (!req.file) {
            return res.status(400).send("No image file provided.");
        }
        inputImg = req.file;

        // const outputImgPath = '../imgUploads/outputImg/outputImg.jpg';

        const toUserData = await User.findOne({email:toUserEmail});
        if(!toUserData){
            throw new Error("Could not find the user.");
        }

        const hexRegex = /^[0-9A-Fa-f]{6}$/;
        if(!hexRegex.test(stegoKey)){
            throw new Error("Invalid stego key.");
        }

        
        const recoverykey = await embedMsg(inputImg.path,outputImgPath,stegoMsg,stegoKey);
        
        

        const recoveryKeyHash= await bcrypt.hash(recoverykey,10);

        const {pixels:imgBuffer,width,height,channels} = await imgToArray(outputImgPath);

        const newStegoMsg = new StegoMsg({
            fromUserId,
            toUserId : toUserData._id,
            imageBuffer: {
                data: imgBuffer,
                contentType: 'image/jpeg'  // or req.file.mimetype for dynamic type
            },

            width,
            height,
            channels,
            recoveryKeyHash
        })

        const msgData = await newStegoMsg.save();

        res.json({
            message:"stego message sent successfully!",
            recoveryKey:recoverykey
        })

    } catch (err) {
        res.status(500).send("FAILED: "+err.message);
    }
    finally {
        if (inputImg?.path && fs.existsSync(inputImg.path)) fs.unlinkSync(inputImg.path);
        if (fs.existsSync(outputImgPath)) fs.unlinkSync(outputImgPath);
    }
});

stegoRouter.post("/recoverStegoMsg",userAuth,async(req,res)=>{

    const imgPath = path.join(__dirname, '../imgUploads/modifiedImg/img1.jpg');

    try {
        const {recoveryKey,tolerance, _id, fromUserId,toUserId}= req.body;

        const stegoMsg = await StegoMsg.findOne({
            _id,
            fromUserId,
            toUserId
        });
        const {imageBuffer,width,height,channels,recoveryKeyHash } = stegoMsg;

        const isRecoveryKeyValid = await stegoMsg.validateRecoveryKey(recoveryKey);

        if(!isRecoveryKeyValid){
            throw new Error("Incorrect Recovery Key.");
        }

        await bufferToImg(imageBuffer.data,width,height,channels,imgPath);

        const recoveredMsg = await recoverMsg(imgPath,recoveryKey,tolerance);

        res.status(200).json({
            message:"StegoMsg recovered successfully!",
            recoveredMsg: recoveredMsg
        });


    } catch (err) {
        res.status(500).send("Failed: "+err.message);
    }
    finally{
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
})
module.exports = stegoRouter;