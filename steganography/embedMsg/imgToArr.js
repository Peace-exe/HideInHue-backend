const Jimp = require("jimp");

const imgToArr = async(path)=>{
    const image = await Jimp.read(path);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const pixelArray = [];

    image.scan(0, 0, width, height, (x, y, idx)=> {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    pixelArray.push([r, g, b]);

    });

    return pixelArray;

}

module.exports = imgToArr;