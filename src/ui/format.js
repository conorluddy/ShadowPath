// Pure formatting helpers for the control panel. Kept separate from the DOM
// glue in controls.js so the display logic can be unit tested directly.

/**
 * Format a param value for its <output> label. Fractional-step ranges show two
 * decimals (with a tidy single trailing zero); integer-step ranges show plainly.
 * @param {import("../core/types.js").ParamSpec} spec
 * @param {number} value
 */
export function formatParamValue(spec, value) {
  const step = spec.step ?? 1;
  if (!Number.isInteger(step)) {
    return Number(value).toFixed(2).replace(/\.00$/, ".0");
  }
  return String(value);
}
