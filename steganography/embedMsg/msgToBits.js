const msgToBits = (str)=>{
    const bits = str
        .split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('')
        .split('')
        .map(Number);

    return bits;
}


module.exports = msgToBits;

