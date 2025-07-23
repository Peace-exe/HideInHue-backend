const express = require("express");
const {validateAdminSignUpData, validateSignUpData} = require("../utils/helperValidator");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {JWT_PRIVATE_KEY}= require("../utils/constants");
const authorizeRole = require("../middlewares/authorizeRole");
const { userAuth } = require("../middlewares/auth");
const validator = require("validator");

const authRouter = express.Router();

authRouter.post("/createAdmin", async (req,res)=>{

    try {
        validateAdminSignUpData(req);

        const {adminId,firstName,lastName,email,password}=req.body;

        const passwordHash = await bcrypt.hash(password,10);

        const user = new User({
            adminId,
            firstName,
            lastName,
            email,
            password:passwordHash

        });
        const newUserData= await user.save(); //saving the User instance to our DB //this function returns a promise
        const userObj = newUserData.toObject();
        delete userObj.password;
        delete userObj.adminId;

        res.status(201).json({
            message : "admin created successfully!",
            userObj
        });
    } catch (error) {
        res.status(400).send("Failed: "+error.message);
    }
});

authRouter.post("/createUser",userAuth,authorizeRole(['admin']) ,async(req,res)=>{
    try {
        const {firstName,lastName,email,password} = req.body;

        validateSignUpData(req);

        const passwordHash= await bcrypt.hash(password,10);

        const user = new User({
            firstName,
            lastName,
            email,
            password:passwordHash
        });

        const newUserData = await user.save();
        const userObj = newUserData.toObject();
        delete userObj.password;

        res.status(201).json({
            message : "User created successfully!",
            userObj
        });

    } catch (error) {
         res.status(400).send("Failed.\n"+error.message);
    }
});

authRouter.post("/login",async(req,res)=>{
    try {
        const {email, password} = req.body;

        if (!email || !validator.isEmail(email)) {
            throw new Error("Invalid Credentials.");
        }

        const userData = await User.findOne({email});
        if(!userData){
            throw new Error("Invalid Credentials.");
        }

        const isPasswordValid = await userData.validatePassword(password);

        if(!isPasswordValid){
            throw new Error("Invalid Credentials.");
        }
        else{
            const token = jwt.sign({_id : userData._id}, JWT_PRIVATE_KEY,{
            expiresIn:"1d"
            });

            res.cookie("token",token, {
                expires:new Date(Date.now()+24*3600000)
            });
                    
            const {_id,role,firstName,lastName,email,designation,createdAt}= userData;
            
                    
            res.status(200).json({
               data:{ _id,role,firstName,lastName,email,designation,createdAt}
            });
        }

        
                    
        

    } catch (error) {
        res.status(400).send("Invalid Credentials "+error.message);
    }
})

authRouter.post("/logout",(req,res)=>{
    res
        .cookie("token",null,{
            expires:new Date(Date.now())
        })
        .send("logout successful");
})
module.exports=authRouter;