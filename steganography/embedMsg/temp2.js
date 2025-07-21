const imgToArray = require("./imgToBuffer");
const msgToBits = require("./msgToBits");
const bufferToImg = require("./bufferToImg");
const {groupArr,flattenArr} = require("./arrMethods");
const xor = require("./xor");
const cm = require("./cm");
const arrToHex = require("./arrToHex");
const { RGBtoYCbCr, YCbCrToRGB } = require("./pixelConverter");

const inputImgPath = './inputImg/inputImg .jpg';
const msg = "Leonardo da Vinci";
const msgBits = msgToBits(msg);
//console.log(msgBits);
const msgSize = msgBits.length;
//console.log(msgSize);
const outputImgPath = './outputImg/outputImg1.jpg';
const stegoKey = "A2003F";
let key1 = stegoKey;
let key2 = "000000";

const processImg = async(imgPath)=>{
    try{
        const { pixels:pixels1, width, height, channels } = await imgToArray(imgPath);
        const pixelArray = groupArr(Array.from(pixels1));
        const imgLength = width*height;

        const segmentArray = (pixelArray, size, segmentSize = 32) => {
            const res = [];

            for (let i = 0; i < size; i += segmentSize) {
                    const segment = [];

                    for (let j = 0; j < segmentSize && (i + j) < size; j++) {
                        segment.push(pixelArray[i + j]);
                    }

                    res.push(segment);
            }

            return res;
        };
        const finalArray = segmentArray(pixelArray,imgLength);

        return {pixelArray,finalArray,width, height, channels}
    }
    catch(err){
        console.error(err.message);
    }

}



const getPixelPositions = async () => {
    
    //console.log(finalArray)
    const {pixelArray,finalArray,width, height, channels} = await processImg(inputImgPath);
    const imgLength = width*height;
    let bitsAtHand = 0;
    let fullBits = Math.floor(msgSize/6);
    let remainingBits = msgSize%6;

    let bitsPerPixel = msgSize/imgLength;

    if(bitsPerPixel>0.75){
            throw new Error("Message is too big to get embedded inside this image.");
    }


    let carryOverBits = 0
    let maxBitsSize = 0

    let segmentSize = 0;
    let sequence1 = [];
    let sequence2 = []
    let pixelPositionArray =[];
    let pixelPosition = 0;

    let bitCount = 0
    
    for (let i = 0 ; i<finalArray.length && bitCount < msgSize ;i++){
       
        
        /*
        if(i === fullBits){
            bitsAtHand = remainingBits;
        }
        else{
            bitsAtHand = 6;
        }
        */
        

        if(finalArray[i].length === 32){
            segmentSize = 32;
        }
        else{
            segmentSize = finalArray[i].length;
        }
        bitsAtHand = Math.round(segmentSize * bitsPerPixel + carryOverBits);
        carryOverBits = bitsAtHand - (segmentSize*bitsPerPixel + carryOverBits);
        if(bitsAtHand<=0) {
            
            bitsAtHand=1;
            
        }

        
        key1 = xor(key1, key2);  
        //console.log(key1)
        sequence1 = cm(key1, 6, 16);
        key2 = arrToHex(sequence1);  
        sequence2 = cm(key2,bitsAtHand,segmentSize);

        //console.log(sequence2);
        //counter++
        

       
        
        sequence2.forEach((index,num)=>{

            pixelPosition = segmentSize*i + num;

            if (pixelPosition < pixelArray.length) {
            pixelPositionArray.push(pixelPosition);
            }
            else{
                pixelPositionArray.push(sequence2[index]);
            }

        });
        
        
        bitCount+=bitsAtHand;


    }
    //console.log(counter);
    return pixelPositionArray;
};
const embedBits = async(pixelPositionsArray, msgBits) => {
    const { pixelArray, finalArray, width, height, channels } = await processImg(inputImgPath);
    const imgLength = width * height;
    const l = 15; // Coefficient tolerance
    let luma = 0, cb = 0, cr = 0, pixel = [], ycbcr = [], remainder = 0;

    const minLumaThreshold = 4 * l;

    for (let i = 0; i < pixelPositionsArray.length && i < msgBits.length; i++) {
        pixel = pixelArray[pixelPositionsArray[i]];
        //if(i===3)console.log(pixel)
        ycbcr = RGBtoYCbCr.convert(pixel);
        luma = ycbcr[0];
        cb = ycbcr[1];
        cr = ycbcr[2];

        if (luma < minLumaThreshold) {
            luma += minLumaThreshold; // Boost low luma to ensure mod space
        }

        remainder = luma % (4 * l);

        if (msgBits[i] === 0) {
            if (remainder !== l) {
                luma = luma - remainder + l;
            }
        } else if (msgBits[i] === 1) {
            if (remainder !== 3 * l) {
                luma = luma - remainder + (3 * l);
            }
        }

        // Clamp luma within 0-255
        if (luma < 0) luma = 0;
        if (luma > 255) luma = 255;

        const newYCbCr = [luma, cb, cr];
        let newRGB = YCbCrToRGB.convert(newYCbCr);

        // Clamp each RGB component to 0-255 to avoid overflow/underflow
        newRGB = newRGB.map(val => Math.min(255, Math.max(0, Math.round(val))));

        pixelArray[pixelPositionsArray[i]] = newRGB;
        //if (i===3){console.log(pixelArray[pixelPositionsArray[i]]);console.log(newYCbCr);}
    }

    return {
        modifiedPixelArray: pixelArray,
        width,
        height,
        channels
    };
};

const getOutputImg = async(modifiedPixelArray,width,height,channels,outputImgPath)=>{
    const flatArr = flattenArr(modifiedPixelArray);
    const buffer = Buffer.from(flatArr);
    await bufferToImg(buffer,width,height,channels,outputImgPath);
    
}
const getRecoveryKey = (msgBits,stegoKey)=>{
    const length = msgBits.length;
    const hexString = length.toString(16).padStart(6, '0');
    const recoveryKey = stegoKey+hexString;
    return recoveryKey
}

const embedMsg = async()=> {
    try {
        const pixelPositions = await getPixelPositions();

        const { modifiedPixelArray, width, height, channels } = await embedBits(pixelPositions, msgBits);

        await getOutputImg(modifiedPixelArray, width, height, channels, outputImgPath);

        const recoveryKey = getRecoveryKey(msgBits, stegoKey);
        console.log(recoveryKey);
    } catch (err) {
        console.error("Error processing image:", err);
    }
}

module.exports=embedMsg
