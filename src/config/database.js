const mongoose = require("mongoose");
const {URI} = require("../utils/constants");

const connectDB = async()=>{
    await mongoose.connect(URI);

}

module.exports= connectDB;