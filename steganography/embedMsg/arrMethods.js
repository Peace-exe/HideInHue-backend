const groupArr = (flatArr)=> {
  const len = flatArr.length;
  const grouped = new Array(len / 3); 

  for (let i = 0, j = 0; i < len; i += 3, j++) {
    
    grouped[j] = [flatArr[i], flatArr[i + 1], flatArr[i + 2]];
  }

  return grouped;

  
}

const flattenArr = (pixelArray) => {
    return pixelArray.reduce((acc, curr) => acc.concat(curr), []);
};


module.exports= {
  groupArr,
  flattenArr

};