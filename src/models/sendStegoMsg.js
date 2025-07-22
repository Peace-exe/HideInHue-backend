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
    imageBuffer: {
        data: {
            type: Buffer,
            required: true
        },
        contentType: {
            type: String,
            required: true
        }
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
},{ timestamps: true });
StegoMsgSchema.pre("save", function (next){
    const StegoMsg = this;

    if(StegoMsg.fromUserId.equals(StegoMsg.toUserId)){
        throw new Error("you cannot send a connection request to yourself.");
    }

    next();

});

StegoMsgSchema.methods.validateRecoveryKey = async function(recoveryKeyInputByUser) {
    const stegoMsg = this;
    const recoveryKeyHash = stegoMsg.recoveryKeyHash;
    const isKeyValid = await bcrypt.compare(recoveryKeyInputByUser, recoveryKeyHash);
    return isKeyValid;
};

StegoMsgSchema.index({fromUserId:1, toUserId:1});

const StegoMsg = mongoose.model("StegoMsg",StegoMsgSchema);

module.exports = StegoMsg;