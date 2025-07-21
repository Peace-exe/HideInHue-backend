const express = require("express");
const { userAuth } = require("../middlewares/auth");
const uploadImg = require("../middlewares/uploadImg");
const User = require("../models/user");
const embedMsg = require("../../steganography/embedMsg/embedMsg");
const bcrypt = require("bcrypt");
const imgToArray = require("../../steganography/embedMsg/imgToBuffer");
const StegoMsg = require("../models/sendStegoMsg");


const stegoRouter = express.Router();

stegoRouter.post("/sendStegoMsg",userAuth,uploadImg.single("imgFile"),async(req,res)=>{
    try {
        const fromUserId = req.user._id;
        const {toUserEmail ,stegoKey,stegoMsg} = req.body;
        const inputImg = req.file;

        const outputImgPath = '../imgUploads/outputImg/outputImg.jpg';

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
            channels
        })

        const msgData = await newStegoMsg.save();

        res.json({
            message:"stego message sent successfully!",
            stegoMsgData:msgData
        })

    } catch (err) {
        res.status(400).send("FAILED: "+err.message);
    }
});

module.exports = stegoRouter;