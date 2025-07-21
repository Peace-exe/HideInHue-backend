const RGBtoYCbCr = {
  convert: (rgb) => {
    const [r, g, b] = rgb;

    // BT.601 conversion formulas
    const Y  = 16 + (65.738 * r + 129.057 * g + 25.064 * b) / 256;
    const Cb = 128 + (-37.945 * r - 74.494 * g + 112.439 * b) / 256;
    const Cr = 128 + (112.439 * r - 94.154 * g - 18.285 * b) / 256;

    // Round to nearest integer but skip clamping to YCbCr range
    return [
      Math.round(Y),
      Math.round(Cb),
      Math.round(Cr)
    ];
  }
};

const YCbCrToRGB = {
  convert: (ycbcr) => {
    const [Y, Cb, Cr] = ycbcr;

    const yScaled = Y - 16;
    const cbScaled = Cb - 128;
    const crScaled = Cr - 128;

    // BT.601 conversion formulas
    const r = 1.164 * yScaled + 1.596 * crScaled;
    const g = 1.164 * yScaled - 0.392 * cbScaled - 0.813 * crScaled;
    const b = 1.164 * yScaled + 2.017 * cbScaled;

    // Clamp to 0-255 RGB range
    return [
      Math.min(255, Math.max(0, Math.round(r))),
      Math.min(255, Math.max(0, Math.round(g))),
      Math.min(255, Math.max(0, Math.round(b)))
    ];
  }
};

module.exports = { 
  RGBtoYCbCr,
  YCbCrToRGB
};
