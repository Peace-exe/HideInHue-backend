const  recoverMsg = require("./recoverMsg");

const imgPath="../outputImg/outputImg1.jpg"
let recoveryKey = "AE106F0000A0";
recoveryKey= recoveryKey.toUpperCase();
recoverMsg(imgPath,recoveryKey)
.then(result=>console.log(result))
.catch(err => console.log("Failed: "+err.message));