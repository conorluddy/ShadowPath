// Pure list-reordering helper for the drag-and-drop process chain. Kept out of
// the DOM layer so the array maths is unit testable without a browser.

/**
 * Return a copy of `array` with the item at `fromIndex` moved to `toIndex`.
 * Out-of-range indices are clamped, so a drop past either end lands at the edge.
 * @template T
 * @param {T[]} array
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {T[]}
 */
export function moveItem(array, fromIndex, toIndex) {
  const from = clamp(fromIndex, 0, array.length - 1);
  const to = clamp(toIndex, 0, array.length - 1);
  if (from === to) {
    return array.slice();
  }
  const next = array.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
