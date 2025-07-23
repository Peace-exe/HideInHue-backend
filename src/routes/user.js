const express = require("express");
const { userAuth } = require("../middlewares/auth");
const StegoMsg = require("../models/sendStegoMsg");


const userRouter = express.Router();

userRouter.get("/stegoMsgs/inbox",userAuth,async(req,res)=>{
    try {
        const {_id} = req.user;

        const receivedMsgs = await StegoMsg.find({toUserId:_id}).populate("fromUserId");

        res.status(200).json({
            message:"Data fetched successfully.",
            receivedMsgs:receivedMsgs
        })
    } catch (err) {
        res.status(500).send("Failed: "+err.message);
    }
})

module.exports= userRouter;