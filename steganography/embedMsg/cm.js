
/*
const cm=(keyHex, length, range=32, lambda = 0.9999) =>{

    // Convert 6-hex-digit key to decimal and normalize to (0, 1)
    let seedDecimal = parseInt(keyHex, 16);
    let x = (seedDecimal % 1000000) / 1000000;  
    
    const sequence = [];

    for (let i = 0; i < length; i++) {
        x = 4 * lambda * x * (1 - x);

        // Scale the result to required range (e.g., [0, 31])
        const chaoticValue = Math.floor(x * range);
        sequence.push(chaoticValue);
    }

    return sequence;
}

const key = "151C0C"; // 6-digit hex key
const length = 6;     // How many values you want
const sequence = cm(key, length);
console.log(sequence); // Example output: [29, 23, 25, 9, 18, ...]

module.exports= cm;
*/

const chaoticMap = (keyHex, length, range = 32, lambda = 0.9999, precision = 1000000) => {
    // Validate inputs
    if (!/^[0-9A-Fa-f]{6}$/.test(keyHex)) {
        throw new Error('Key must be 6-digit hexadecimal');
    }
    if (lambda <= 0 || lambda > 1) {
        throw new Error('Lambda must be in (0, 1]');
    }

    // Convert hex key to normalized initial value (0 < x < 1)
    const seedDecimal = parseInt(keyHex, 16);
    let x = ((seedDecimal % (precision - 1)) + 1) / precision;  // Ensures x ∈ (0,1)
    
    const sequence = [];
    const r = 4 * lambda;  // Chaotic parameter (3.9996 when λ = 0.9999)

    for (let i = 0; i < length; i++) {
        // Logistic map iteration
        x = r * x * (1 - x);
        
        // Clamp to prevent numerical instability
        x = Math.max(Number.EPSILON, Math.min(1 - Number.EPSILON, x));
        
        // Scale to desired range
        const chaoticValue = Math.floor(x * range);
        sequence.push(chaoticValue);
    }

    return sequence;
};

module.exports = chaoticMap;
