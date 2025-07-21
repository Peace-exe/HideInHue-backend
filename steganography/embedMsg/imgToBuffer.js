const sharp = require("sharp");

const imgToArray = async (path) => {
    const { data, info } = await sharp(path)
        .removeAlpha() // Ensure it's RGB only (3 channels)
        .raw()
        .toBuffer({ resolveWithObject: true });

    return {
        pixels: data, // KEEP AS BUFFER, not Array
        width: info.width,
        height: info.height,
        channels: info.channels
    };
};

module.exports = imgToArray;
