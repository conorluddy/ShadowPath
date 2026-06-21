// Shared test fixtures. These keep the specs readable and DOM-free: plugins are
// pure and operate on duck-typed data, so plain objects stand in for browser
// ImageData and for masks.

/**
 * Build an RGBA image from a painter callback.
 * @param {number} width
 * @param {number} height
 * @param {(x: number, y: number) => [number, number, number, number]} paint
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }}
 */
export function rgbaImage(width, height, paint) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = paint(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return { data, width, height };
}

/**
 * Build an opaque black-on-white image from an ASCII grid. `#` is black
 * (foreground), anything else is white. Rows must be equal length.
 * @param {string[]} rows
 */
export function imageFromAscii(rows) {
  const height = rows.length;
  const width = rows[0].length;
  return rgbaImage(width, height, (x, y) => {
    const filled = rows[y][x] === "#";
    const v = filled ? 0 : 255;
    return [v, v, v, 255];
  });
}

/**
 * Build a binary mask from an ASCII grid. `#` is filled (1), else 0.
 * @param {string[]} rows
 * @returns {{ data: Uint8Array, width: number, height: number }}
 */
export function maskFromAscii(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      data[y * width + x] = rows[y][x] === "#" ? 1 : 0;
    }
  }
  return { data, width, height };
}

/** A contour set wrapper for feeding process/export plugins directly. */
export function contourSet(paths, width = 16, height = 16) {
  return { paths, width, height };
}
