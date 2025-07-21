[
  0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0,
  0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0,
  0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0,
  1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1,
  0, 1, 1, 1, 0, 1, 0, 0
]

[
  0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
  0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0,
  0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0,
  1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1,
  0, 1, 1, 1, 0, 1, 0, 0
]

/**
 * Compares specific pixel positions between two RGB pixel arrays
 * @param {Array<[number, number, number]>} pixels1 - First image's pixels [R,G,B][]
 * @param {Array<[number, number, number]>} pixels2 - Second image's pixels [R,G,B][]
 * @param {Array<number>} positions - Array of pixel indices to compare
 * @param {number} [msgSize] - Optional: Expected number of mismatched pixels
 * @returns {Object} Comparison result with detailed match/mismatch information
 */
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

// Example usage:
const image1 = [[255,0,0], [0,255,0], [0,0,255], [255,255,255], [100,100,100]];
const image2 = [[255,0,0], [0,255,1], [0,1,255], [255,255,0], [100,100,100]];
const positionsToCheck = [0, 1, 2, 3, 4]; // Positions to compare

const comparisonResult = compareImagePixels(image1, image2, positionsToCheck, 3);
console.log(comparisonResult);