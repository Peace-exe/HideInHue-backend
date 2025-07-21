const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const StegoMsgSchema = mongoose.Schema({
    fromUserId :{
        type : mongoose.Schema.Types.ObjectId,
        required:true,
        ref : "User"
    },
    toUserId :{
        type : mongoose.Schema.Types.ObjectId,
        required:true,
        ref : "User"
    },
    imageBuffer:{
        data : Buffer,
        contentType:'image/jpeg',
        required:true
    },
    width :{
        type:Number,
        required:true
    },
    height:{
        type:Number,
        required:true
    },
    channels :{
        type:Number,
        required:true
    },
    recoveryKeyHash :{
        type:String,
        required:true
    }
});
StegoMsgSchema.pre("save", function (next){
    const StegoMsg = this;

    if(StegoMsg.fromUserId.equals(StegoMsg.toUserId)){
        throw new Error("you cannot send a connection request to yourself.");
    }

    next();

});

StegoMsgSchema.methods.validatePassword = async function(passwordInputByUser){
    const user= this;
    const passwordHash= user.password;
   const isPasswordValid= await bcrypt.compare(passwordInputByUser, passwordHash);
   return isPasswordValid;
}
StegoMsgSchema.index({fromUserId:1, toUserId:1});

const StegoMsg = mongoose.model("StegoMsg",StegoMsgSchema);

module.exports = StegoMsg;