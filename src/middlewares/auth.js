const {JWT_PRIVATE_KEY}=require("../utils/constants");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const userAuth= async (req,res,next)=>{
    try {

        
        //read the cookie from the request
        const {token}=req.cookies;
        if(!token){
            return res.status(401).send("User not authorised. Please login.");
        }

        //verify the token
        const payload= jwt.verify(token , JWT_PRIVATE_KEY);
        const {_id} = payload;

        // find the user in the db 
        const userData= await User.findById(_id);
        if(!userData){
            throw new Error("user does not exist.");
        }

        req.user= userData; //attaching the user object(user data) with the request itself so that next request handler or middleware can read it. 
        next(); //call the next middleware or request handler



    } catch (err) {
        res.status(400).send("ERROR: "+ err.message);
    }
}

module.exports={
    userAuth
};