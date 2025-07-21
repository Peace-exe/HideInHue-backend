const embedBits = async(pixelPositionsArray,msgBits)=>{

    const {pixelArray,finalArray,width, height, channels}= await processImg(inputImgPath);
    const imgLength = width*height;
    const l=1; //coefficient tolerence;
    let luma = 0;
    let cb = 0;
    let cr = 0;
    let pixel = [];
    let ycbcr = [];
    let remainder =0;
    
    //let counter= 0

    for(let i =0;i<pixelPositionsArray.length && i<msgBits.length;i++){


        pixel = pixelArray[pixelPositionsArray[i]];
        console.log("before: "+pixel);
        ycbcr = RGBtoYCbCr.convert(pixel);
        luma = ycbcr[0];
        cb = ycbcr[1];
        cr = ycbcr[2];
        if(i===3){
            console.log("original pixel: "+pixel)
            console.log("ycbcr pixel: "+ycbcr)
            console.log("msg bit: "+msgBits[i])
        }
        if(msgBits[i]===0){
            remainder = luma % (4*l);
            
            if(remainder!=l){
                
                luma = luma - remainder + l;
            }
           
        }
        else if(msgBits[i]===1){
            remainder = luma % (4*l);
           
            if(remainder!=3*l){
                
                luma = luma - remainder + (3*l)
            }
        }

        // Clamp luma to valid range
        while (luma < 0) luma += 4 * l;
        while (luma > 255) luma -= 4 * l;

        let newYCbCr = [luma,cb,cr];
        if(i===3){
            console.log("new luma: "+luma)
            console.log("new ycbcr pixel: "+newYCbCr);
        }
        let newRGB = YCbCrToRGB.convert(newYCbCr);
        pixelArray[pixelPositionsArray[i]]= newRGB;
        console.log("after: "+pixelArray[pixelPositionsArray[i]]);
        //counter++
    }
    //console.log(counter);
    return { 
        modifiedPixelArray:pixelArray , 
        width, 
        height, 
        channels 

    };

}

const RGBtoYCbCr = {
  convert: (rgb) => {
    const [r, g, b] = rgb;
    
    // BT.601 conversion formulas
    const Y  = Math.round(16 + (65.738 * r + 129.057 * g + 25.064 * b) / 256);
    const Cb = Math.round(128 + (-37.945 * r - 74.494 * g + 112.439 * b) / 256);
    const Cr = Math.round(128 + (112.439 * r - 94.154 * g - 18.285 * b) / 256);
    
    // Clamp to standard YCbCr ranges
    return [
      Math.max(16, Math.min(235, Y)),   // Y: 16-235
      Math.max(16, Math.min(240, Cb)),  // Cb: 16-240
      Math.max(16, Math.min(240, Cr))   // Cr: 16-240
    ];
  }
};

const YCbCrToRGB = {
  /**
   * Convert YCbCr pixel to RGB
   * @param {number[]} ycbcr - Array with [Y, Cb, Cr] values (Y: 16-235, Cb/Cr: 16-240)
   * @returns {number[]} Array with [r, g, b] values (0-255)
   */
  convert: (ycbcr) => {
    const [Y, Cb, Cr] = ycbcr;

    // Normalize YCbCr to reference ranges (Y:16-235 → 0-219, Cb/Cr:16-240 → -112 to 112)
    const yScaled = Y - 16;
    const cbScaled = Cb - 128;
    const crScaled = Cr - 128;

    // BT.601 conversion formulas
    const r = Math.round(1.164 * yScaled + 1.596 * crScaled);
    const g = Math.round(1.164 * yScaled - 0.392 * cbScaled - 0.813 * crScaled);
    const b = Math.round(1.164 * yScaled + 2.017 * cbScaled);

    // Clamp to RGB range (0-255)
    return [
      Math.max(0, Math.min(255, r)),
      Math.max(0, Math.min(255, g)),
      Math.max(0, Math.min(255, b))
    ];
  }
};

module.exports ={ 
    RGBtoYCbCr,
    YCbCrToRGB

};

const getBits = ({pixelPositionArray,pixelArray,msgSize})=>{
    let msgBits =[];
    let pixel = [];
    let ycbcr= [];
    let luma =0
    let bit = -1;
    const l =15;//cooefficient tolerence;

    try {
        if(pixelPositionArray.length != msgSize ){
            throw new Error("Something went wrong.");
        }

        for (let i =0;i<pixelPositionArray.length && i<msgSize;i++){
            pixel = pixelArray[pixelPositionArray[i]];
            ycbcr = RGBtoYCbCr.convert(pixel);
            luma = ycbcr[0];

            const remainder = luma % (4 * l);
            if (remainder === l) {
                bit = 0;
            } else if (remainder === 3 * l) {
                bit = 1;
            } else {
                console.log("pixel: "+ycbcr);
                throw new Error(`Invalid luma mod condition at index ${i}: remainder ${remainder}: pixel ${pixel}: ycbcr ${ycbcr}`);
            }
            msgBits.push(bit);


        }
        if(msgSize != msgBits.length){
            throw new Error("Message could not be recovered.");
        }
        return msgBits

    } catch (error) {
        console.log("Something went wrong.\n"+error.message);
    }
}
/*
// Example usage
console.log(RGBtoYCbCr.convert([255, 255, 255])); // [235, 128, 128] (white)
console.log(RGBtoYCbCr.convert([0, 0, 0]));       // [16, 128, 128] (black)
console.log(RGBtoYCbCr.convert([255, 0, 0]));     // [81, 90, 240] (red)
*/
/*
// Example Usage
console.log(YCbCrToRGB.convert([235, 128, 128])); // [255, 255, 255] (white)
console.log(YCbCrToRGB.convert([16, 128, 128]));  // [0, 0, 0] (black)
console.log(YCbCrToRGB.convert([81, 90, 240]));   // [255, 0, 0] (red)
*/

const RGBtoYCbCr2 = {
  convert: (rgb) => {
    const [r, g, b] = rgb;

    // BT.601 conversion formulas
    const Y  = 16 + (65.738 * r + 129.057 * g + 25.064 * b) / 256;
    const Cb = 128 + (-37.945 * r - 74.494 * g + 112.439 * b) / 256;
    const Cr = 128 + (112.439 * r - 94.154 * g - 18.285 * b) / 256;

    // Round to nearest integer but skip clamping to YCbCr range
    return [
      Math.round(Y),
      Math.round(Cb),
      Math.round(Cr)
    ];
  }
};

const YCbCrToRGB2 = {
  convert: (ycbcr) => {
    const [Y, Cb, Cr] = ycbcr;

    const yScaled = Y - 16;
    const cbScaled = Cb - 128;
    const crScaled = Cr - 128;

    // BT.601 conversion formulas
    const r = 1.164 * yScaled + 1.596 * crScaled;
    const g = 1.164 * yScaled - 0.392 * cbScaled - 0.813 * crScaled;
    const b = 1.164 * yScaled + 2.017 * cbScaled;

    // Clamp to 0-255 RGB range
    return [
      Math.min(255, Math.max(0, Math.round(r))),
      Math.min(255, Math.max(0, Math.round(g))),
      Math.min(255, Math.max(0, Math.round(b)))
    ];
  }
};


