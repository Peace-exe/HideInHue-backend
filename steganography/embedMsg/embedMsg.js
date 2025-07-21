const imgToArray = require("./imgToBuffer");
const msgToBits = require("./msgToBits");
const bufferToImg = require("./bufferToImg");
const { groupArr, flattenArr } = require("./arrMethods");
const xor = require("./xor");
const cm = require("./cm");
const arrToHex = require("./arrToHex");
const { RGBtoYCbCr, YCbCrToRGB } = require("./pixelConverter");

const processImg = async (imgPath) => {
    try {
        const { pixels: pixels1, width, height, channels } = await imgToArray(imgPath);
        const pixelArray = groupArr(Array.from(pixels1));
        const imgLength = width * height;

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

        const finalArray = segmentArray(pixelArray, imgLength);
        return { pixelArray, finalArray, width, height, channels };
    } catch (err) {
        console.error(err.message);
    }
};

const getPixelPositions = async (imgPath, msgSize, stegoKey) => {
    const { pixelArray, finalArray, width, height } = await processImg(imgPath);
    const imgLength = width * height;
    let bitsPerPixel = msgSize / imgLength;

    if (bitsPerPixel > 0.75) {
        throw new Error("Message is too big to get embedded inside this image.");
    }

    let key1 = stegoKey;
    let key2 = "000000";
    let carryOverBits = 0;
    let pixelPositionArray = [];
    let bitCount = 0;
    let segmentSize = 0;

    while (bitCount < msgSize) {
        for (let i = 0; i < finalArray.length && bitCount < msgSize; i++) {
            segmentSize = finalArray[i].length;
            let bitsAtHand = Math.round(segmentSize * bitsPerPixel + carryOverBits);
            carryOverBits = bitsAtHand - (segmentSize * bitsPerPixel + carryOverBits);
            if (bitsAtHand <= 0) bitsAtHand = 1;

            key1 = xor(key1, key2);
            const sequence1 = cm(key1, 6, 16);
            key2 = arrToHex(sequence1);
            const sequence2 = cm(key2, bitsAtHand, segmentSize);

            sequence2.forEach((_, num) => {
                const pixelPosition = segmentSize * i + num;
                if (pixelPosition < pixelArray.length) {
                    pixelPositionArray.push(pixelPosition);
                    //bitCount+=1;
                }
            });

            bitCount += bitsAtHand;
        }
    }
    pixelPositionArray= pixelPositionArray.slice(0,msgSize);
    return pixelPositionArray;
};

const embedBits = async (imgPath, pixelPositionsArray, msgBits) => {
    const { pixelArray, width, height, channels } = await processImg(imgPath);
    const l = 15;
    const minLumaThreshold = 4 * l;

    for (let i = 0; i < pixelPositionsArray.length && i < msgBits.length; i++) {
        let pixel = pixelArray[pixelPositionsArray[i]];
        let [luma, cb, cr] = RGBtoYCbCr.convert(pixel);

        if (luma < minLumaThreshold) luma += minLumaThreshold;
        const remainder = luma % (4 * l);

        if (msgBits[i] === 0 && remainder !== l) {
            luma = luma - remainder + l;
        } else if (msgBits[i] === 1 && remainder !== 3 * l) {
            luma = luma - remainder + (3 * l);
        }

        luma = Math.min(255, Math.max(0, luma));
        const newRGB = YCbCrToRGB.convert([luma, cb, cr]).map(val => Math.min(255, Math.max(0, Math.round(val))));
        pixelArray[pixelPositionsArray[i]] = newRGB;
    }

    return { modifiedPixelArray: pixelArray, width, height, channels };
};

const getOutputImg = async (modifiedPixelArray, width, height, channels, outputImgPath) => {
    const flatArr = flattenArr(modifiedPixelArray);
    const buffer = Buffer.from(flatArr);
    await bufferToImg(buffer, width, height, channels, outputImgPath);
};

const getRecoveryKey = (msgBits, stegoKey) => {
    let length = msgBits.length;
    let hexString = length.toString(16).padStart(6, '0');
    hexString= hexString.toUpperCase();
    return stegoKey + hexString;
};

const embedMsg = async (inputImgPath, outputImgPath, msg, stegoKey) => {
    try {
        const msgBits = msgToBits(msg);
        console.log(msgBits)
        const msgSize = msgBits.length;
        //console.log(msgSize);
        const pixelPositions = await getPixelPositions(inputImgPath, msgSize, stegoKey);
        console.log(pixelPositions)
        const { modifiedPixelArray, width, height, channels } = await embedBits(inputImgPath, pixelPositions, msgBits);
        console.log(modifiedPixelArray.slice(0,9));
        await getOutputImg(modifiedPixelArray, width, height, channels, outputImgPath);

        const recoveryKey = getRecoveryKey(msgBits, stegoKey);
        //console.log("Recovery Key:", recoveryKey);
        return recoveryKey;

    } catch (err) {
        console.error("Error embedding message:", err);
    }
};

module.exports = embedMsg;
