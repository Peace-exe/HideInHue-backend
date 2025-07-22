const express = require("express");
const { userAuth } = require("../middlewares/auth");
const uploadImg = require("../middlewares/uploadImg");
const User = require("../models/user");
const embedMsg = require("../../steganography/embedMsg/embedMsg");
const bcrypt = require("bcrypt");
const imgToArray = require("../../steganography/embedMsg/imgToBuffer");
const StegoMsg = require("../models/sendStegoMsg");
const fs = require('fs');

const stegoRouter = express.Router();

stegoRouter.post("/sendStegoMsg",userAuth,uploadImg.single("imgFile"),async(req,res)=>{

    let inputImg = null;  // Declare here
    const outputImgPath = '../imgUploads/outputImg/outputImg.jpg';

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
            imageBuffer : imgBuffer,
            width,
            height,
            channels,
            recoveryKeyHash
        })

        const msgData = await newStegoMsg.save();

        res.json({
            message:"stego message sent successfully!",
            stegoMsgData:msgData
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

})
module.exports = stegoRouter;