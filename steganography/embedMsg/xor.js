/*
function xor(hex1, hex2) {
  // Ensure both hex strings are 6 digits
  if (hex1.length !== 6 || hex2.length !== 6) {
    throw new Error("Hex keys must be exactly 6 digits");
  }

  // Convert to integers
  const num1 = parseInt(hex1, 16);
  const num2 = parseInt(hex2, 16);

  // Perform XOR
  const xor = num1 ^ num2;

  // Convert back to hex and pad with zeros if needed
  return xor.toString(16).padStart(6, '0').toUpperCase();
}

const key1 = "AB106F";
const key2 = "151C0C";
console.log(xor(key1,key2));

module.exports= xor;
*/

function xor(hexKey1, hexKey2) {
    // Validate inputs
    if (typeof hexKey1 !== 'string' || typeof hexKey2 !== 'string') {
        throw new Error('Both inputs must be strings');
    }
    if (!/^[0-9A-Fa-f]{6}$/.test(hexKey1) || !/^[0-9A-Fa-f]{6}$/.test(hexKey2)) {
        throw new Error('Both keys must be 6-digit hexadecimal');
    }

    // Convert to 24-bit integers (6 hex digits = 24 bits)
    const int1 = parseInt(hexKey1, 16);
    const int2 = parseInt(hexKey2, 16);

    // Perform bitwise XOR
    const resultInt = int1 ^ int2;

    // Convert back to 6-digit hex, preserving leading zeros
    const resultHex = resultInt.toString(16)
        .toUpperCase()
        .padStart(6, '0')
        .slice(-6); // Ensure exactly 6 digits

    return resultHex;
}

module.exports = xor;