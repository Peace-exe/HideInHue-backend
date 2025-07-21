const embedMsg = require("./embedMsg");

const inputImgPath = '../inputImg/inputImg.jpg';
const msg = "we ate an ice cream.";
const outputImgPath = '../outputImg/outputImg1.jpg';
const stegoKey = "AE106F";

embedMsg(inputImgPath,outputImgPath,msg,stegoKey)
.then(recoverykey => console.log(recoverykey))
.catch((err)=>{
    console.error("something went wrong.\n"+err.message);
})