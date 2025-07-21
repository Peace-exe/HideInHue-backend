function arrToHex(arr) {
  // Convert each number to 2-digit hex
  const hexParts = arr.map(num => num.toString(16).padStart(2, '0'));

  // Join all hex parts into one string
  let hexString = hexParts.join('');

  // Truncate or pad the string to exactly 6 characters
  if (hexString.length > 6) {
    hexString = hexString.slice(0, 6); // truncate extra
  } else if (hexString.length < 6) {
    hexString = hexString.padEnd(6, '0'); // pad with zeroes
  }

  return hexString.toUpperCase(); // return in UPPERCASE
}

module.exports = arrToHex;

//console.log(arrToHex([ 30, 6, 20, 28, 10, 28 ]))