// Mask stage: turn an RGBA image into a binary foreground mask using a
// luminance threshold, with optional inversion and transparent-pixel skipping.

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** @type {import("../../core/types.js").Plugin} */
export const thresholdMask = {
  id: "threshold",
  kind: "mask",
  label: "Threshold",
  description: "Binarize the image by luminance.",
  params: [
    { name: "threshold", label: "Threshold", type: "range", min: 0, max: 255, step: 1, default: 150 },
    { name: "invert", label: "Trace light areas", type: "boolean", default: false },
    { name: "transparentBg", label: "Ignore transparent pixels", type: "boolean", default: true }
  ],
  run(imageData, params) {
    const { data, width, height } = imageData;
    const out = new Uint8Array(width * height);
    const threshold = Number(params.threshold);
    const invert = Boolean(params.invert);
    const transparentBg = Boolean(params.transparentBg);

    for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
      const alpha = data[index + 3];
      if (transparentBg && alpha < 16) {
        out[pixel] = 0;
        continue;
      }

      const lightness = luminance(data[index], data[index + 1], data[index + 2]);
      out[pixel] = (invert ? lightness >= threshold : lightness <= threshold) ? 1 : 0;
    }

    return { data: out, width, height };
  }
};
