const sharp = require("sharp");

const bufferToImg = async (pixelBuffer, width, height, channels, outputPath) => {
    await sharp(pixelBuffer, {
        raw: {
            width,
            height,
            channels
        }
    })
        .png() // USE LOSSLESS FORMAT
        .toFile(outputPath);
};

module.exports = bufferToImg;
