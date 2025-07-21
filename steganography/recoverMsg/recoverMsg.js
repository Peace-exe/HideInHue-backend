const imgToArray = require("../embedMsg/imgToBuffer");
const { groupArr } = require("../embedMsg/arrMethods");
const xor = require("../embedMsg/xor");
const cm = require("../embedMsg/cm");
const arrToHex = require("../embedMsg/arrToHex");
const { RGBtoYCbCr } = require("../embedMsg/pixelConverter");

const splitRecoveryKey = (recoveryKey) => {
    if (recoveryKey.length !== 12) {
        throw new Error("Invalid Recovery Key.");
    }
    const stegoKey = recoveryKey.slice(0, 6);
    const msgBitsLengthStr = recoveryKey.slice(-6);
    const msgSize = parseInt(msgBitsLengthStr, 16);

    return { stegoKey, msgSize };
};

const processImg = async (imgPath) => {
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
};

const getPixelPositions = async (imgPath, recoveryKey) => {
    const { stegoKey, msgSize } = splitRecoveryKey(recoveryKey);
    let key1 = stegoKey;
    let key2 = "000000";

    const { pixelArray, finalArray, width, height } = await processImg(imgPath);
    const imgLength = width * height;
    const bitsPerPixel = msgSize / imgLength;

    if (bitsPerPixel > 0.75) {
        throw new Error("Message is too big to be embedded inside this image.");
    }

    let carryOverBits = 0;
    let pixelPositionArray = [];
    let bitCount = 0;
    while(bitCount<msgSize){
        for (let i = 0; i < finalArray.length && bitCount < msgSize; i++) {
            const segmentSize = finalArray[i].length;
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
                }
            });

            bitCount += bitsAtHand;
        }
    }
    pixelPositionArray= pixelPositionArray.slice(0,msgSize);
    return { pixelPositionArray, pixelArray, msgSize };
};

const getBits = ({ pixelPositionArray, pixelArray, msgSize }) => {
    let msgBits = [];
    const l = 15;
    const tolerance = 15;
    const modBase = 4 * l;

    if (pixelPositionArray.length !== msgSize) {
        throw new Error("Pixel position array length does not match message size.");
    }

    for (let i = 0; i < pixelPositionArray.length && i < msgSize; i++) {
        const pixel = pixelArray[pixelPositionArray[i]];
        const ycbcr = RGBtoYCbCr.convert(pixel);
        const luma = ycbcr[0];
        if(i<9){console.log(pixel);console.log(luma)}
        const remainder = luma % modBase;
        if (Math.abs(remainder - l) <= tolerance) {
            msgBits.push(0);
        } else if (Math.abs(remainder - 3 * l) <= tolerance) {
            msgBits.push(1);
        } else {
            throw new Error(`Invalid luma remainder at index ${i}: remainder=${remainder}`);
        }
    }

    if (msgBits.length !== msgSize) {
        throw new Error("Recovered bits length mismatch with message size.");
    }

    return msgBits;
};

const processBits = (msgBits) => {
    if (!Array.isArray(msgBits)) {
        throw new Error("Input must be an array of bits (0s and 1s).");
    }

    let message = '';
    for (let i = 0; i < msgBits.length; i += 8) {
        const byteBits = msgBits.slice(i, i + 8);
        const byteStr = byteBits.join('');
        const asciiValue = parseInt(byteStr, 2);
        const char = String.fromCharCode(asciiValue);
        message += char;
    }

    return message;
};


const recoverMsg = async (imgPath, recoveryKey) => {
    try {
        const { pixelPositionArray, pixelArray, msgSize } = await getPixelPositions(imgPath, recoveryKey);
        //console.log(pixelPositionArray);
        const msgBits = getBits({ pixelPositionArray, pixelArray, msgSize });
        console.log(msgBits)
        const message = processBits(msgBits);
        return message;
    } catch (err) {
        console.error("Failed to recover message:", err.message);
        return null;
    }
};

module.exports = recoverMsg;
