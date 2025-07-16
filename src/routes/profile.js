const express = require("express");
const { userAuth } = require("../middlewares/auth");

const profileRouter = express.Router();

profileRouter.get("/profile/view",userAuth, async(req,res)=>{
    try {
        const {_id,role,firstName,lastName,designation}= req.user;
        res.status(200).json({
            data:{_id,role,firstName,lastName,designation}
        })
    } catch (error) {
        
    }
});

module.exports = profileRouter;