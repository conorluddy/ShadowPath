// Output-canvas geometry. Pure functions that decide which window of the
// pixel-space contours an exporter should frame in its SVG viewBox. No DOM, no
// pipeline concerns — the export plugins call these to honour the "Canvas"
// param (full image / crop to shape / aspect-ratio presets) plus padding.

/**
 * Tight axis-aligned bounds over every point in every contour.
 * @param {import("../core/types.js").Contour[]} paths
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number } | null}
 *   null when there are no points to bound.
 */
export function boundingBox(paths) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const path of paths) {
    for (const [x, y] of path) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (minX === Infinity) {
    return null;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Resolve a "Canvas" mode + padding into an SVG viewBox rectangle.
 *
 * @param {import("../core/types.js").ContourSet} contours
 * @param {{ mode?: string, padding?: number }} [options]
 *   mode: "full" (whole source image), "crop" (tight shape bounds), or a ratio
 *   like "16:9" (tight bounds expanded — never clipped — to that aspect ratio).
 *   padding: pixels added on every side of the resolved box.
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function computeViewBox(contours, options = {}) {
  const { mode = "full", padding = 0 } = options;
  const box = resolveBox(contours, mode);
  return outset(box, padding);
}

// === PRIVATE HELPERS ===

const fullImageBox = ({ width, height }) => ({ minX: 0, minY: 0, maxX: width, maxY: height });

function resolveBox(contours, mode) {
  if (mode === "full") {
    return fullImageBox(contours);
  }

  // Every non-full mode frames the traced shape; with nothing traced there is
  // no shape to frame, so fall back to the full image rather than emit a
  // zero-size viewBox.
  const bounds = boundingBox(contours.paths);
  if (!bounds) {
    return fullImageBox(contours);
  }
  if (mode === "crop") {
    return bounds;
  }
  return fitAspectRatio(bounds, parseRatio(mode), contours);
}

// "16:9" -> 16/9. Returns null for anything that is not a positive w:h pair, so
// an unrecognised mode degrades to a tight crop rather than NaN geometry.
function parseRatio(mode) {
  const match = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(mode);
  if (!match) {
    return null;
  }
  const w = Number(match[1]);
  const h = Number(match[2]);
  return w > 0 && h > 0 ? w / h : null;
}

// Expand the shorter axis outward, centred, until the box matches targetRatio.
// "Contain" semantics: the box only ever grows, so the shape is never clipped.
function fitAspectRatio(bounds, targetRatio, contours) {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  // A degenerate (zero-area) shape has no ratio of its own to grow from; leave
  // it as-is, or fall back to the image when the ratio string was malformed.
  if (targetRatio === null) {
    return bounds;
  }
  if (width <= 0 || height <= 0) {
    return fullImageBox(contours);
  }

  if (width / height < targetRatio) {
    const targetWidth = height * targetRatio;
    const grow = (targetWidth - width) / 2;
    return { ...bounds, minX: bounds.minX - grow, maxX: bounds.maxX + grow };
  }
  const targetHeight = width / targetRatio;
  const grow = (targetHeight - height) / 2;
  return { ...bounds, minY: bounds.minY - grow, maxY: bounds.maxY + grow };
}

function outset(box, padding) {
  return {
    x: box.minX - padding,
    y: box.minY - padding,
    width: box.maxX - box.minX + padding * 2,
    height: box.maxY - box.minY + padding * 2
  };
}
