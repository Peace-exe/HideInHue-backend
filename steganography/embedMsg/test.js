const { groupArr } = require("./arrMethods");
const imgToArray = require("./imgToBuffer");

const inputImg = './inputImg/inputImg.jpg';
const outputImg = './outputImg/outputImg1.jpg';
const msgSize = 56;
const pixelPositions = [
     0,    1,   32,   33,   64,   65,   96,   97,  128,  129,  160,
   161,  192,  193,  224,  225,  256,  257,  288,  289,  320,  321,
   352,  353,  384,  385,  416,  417,  448,  449,  480,  481,  512,
   513,  544,  545,  576,  577,  608,  609,  640,  641,  672,  673,
   704,  705,  736,  737,  768,  769,  800,  801,  832,  833,  864,
   865,  896,  897,  928,  929,  960,  961,  992,  993, 1024, 1025,
  1056, 1057, 1088, 1089, 1120, 1121, 1152, 1153, 1184, 1185, 1216,
  1217, 1248, 1249, 1280, 1281, 1312, 1313, 1344, 1345, 1376, 1377,
  1408, 1409, 1440, 1441, 1472, 1473, 1504, 1505, 1536, 1537, 1568,
  1569
]
async function main() {
    try {
        // Process both images
        const { pixelArray: pixelArray1 } = await processImg(inputImg);
        const { pixelArray: pixelArray2 } = await processImg(outputImg);

        // Debug: Check array formats
        console.log('First 3 pixels of image1:', pixelArray1.slice(0, 3));
        console.log('First 3 pixels of image2:', pixelArray2.slice(0, 3));

        // Compare the images
        const result = compareImagePixels(pixelArray1, pixelArray2,pixelPositions, msgSize);
        console.log(result);
        console.log(pixelArray1[320])
        console.log(pixelArray2[320]);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

const processImg = async (imgPath) => {
    try {
        const { pixels, width, height, channels } = await imgToArray(imgPath);
        
        // Check if pixels are already grouped
        let pixelArray;
        if (Array.isArray(pixels[0])) {
            // Already in [R,G,B] format
            pixelArray = pixels;
        } else {
            // Needs grouping
            pixelArray = groupArr(Array.from(pixels));
        }

        const imgLength = width * height;
        const finalArray = segmentArray(pixelArray, imgLength);

        return { pixelArray, finalArray, width, height, channels };
    } catch (err) {
        console.error('Image processing error:', err.message);
        throw err; // Re-throw to handle in main()
    }
};

function segmentArray(pixelArray, size, segmentSize = 32) {
    const res = [];
    for (let i = 0; i < size; i += segmentSize) {
        const segment = [];
        for (let j = 0; j < segmentSize && (i + j) < size; j++) {
            segment.push(pixelArray[i + j]);
        }
        res.push(segment);
    }
    return res;
}

function compareImagePixels(pixels1, pixels2, positions, msgSize) {
    // Input validation
    if (!Array.isArray(pixels1) || !Array.isArray(pixels2)) {
        throw new Error('Both pixel arguments must be arrays');
    }
    if (!Array.isArray(positions)) {
        throw new Error('Positions must be an array');
    }
    if (pixels1.length === 0 || pixels2.length === 0) {
        throw new Error('Pixel arrays cannot be empty');
    }
    if (msgSize !== undefined && (typeof msgSize !== 'number' || msgSize < 0)) {
        throw new Error('msgSize must be a non-negative number');
    }

    const results = {
        mismatchedPositions: [],
        matchedPositions: [],
        mismatchedPixels: 0,
        matchedPixels: 0,
        details: []
    };

    for (const pos of positions) {
        // Validate position
        if (typeof pos !== 'number' || pos < 0 || pos >= pixels1.length || pos >= pixels2.length) {
            throw new Error(`Invalid position ${pos} - out of bounds`);
        }

        const pixel1 = pixels1[pos];
        const pixel2 = pixels2[pos];

        // Validate pixel format
        if (!Array.isArray(pixel1) || !Array.isArray(pixel2)) {
            throw new Error(`Pixels at position ${pos} must be arrays`);
        }
        if (pixel1.length !== 3 || pixel2.length !== 3) {
            throw new Error(`Pixels at position ${pos} must have exactly 3 values (R,G,B)`);
        }

        // Compare RGB values
        const isMatch = pixel1[0] === pixel2[0] && 
                       pixel1[1] === pixel2[1] && 
                       pixel1[2] === pixel2[2];

        if (isMatch) {
            results.matchedPositions.push(pos);
            results.matchedPixels++;
            results.details.push({
                position: pos,
                match: true,
                pixel1,
                pixel2
            });
        } else {
            results.mismatchedPositions.push(pos);
            results.mismatchedPixels++;
            results.details.push({
                position: pos,
                match: false,
                pixel1,
                pixel2,
                differences: {
                    r: pixel2[0] - pixel1[0],
                    g: pixel2[1] - pixel1[1],
                    b: pixel2[2] - pixel1[2]
                }
            });
        }
    }

    // Add summary based on msgSize if provided
    if (msgSize !== undefined) {
        results.passed = results.mismatchedPixels === msgSize;
        results.message = results.mismatchedPixels === 0
            ? 'All compared pixels are identical'
            : results.mismatchedPixels === msgSize
                ? `Found exactly ${msgSize} mismatched pixels as expected`
                : `Found ${results.mismatchedPixels} mismatches (expected ${msgSize})`;
    }

    return results;
}

// Run the main function
main();