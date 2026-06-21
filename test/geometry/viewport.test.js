import test from "node:test";
import assert from "node:assert/strict";

import { boundingBox, computeViewBox } from "../../src/geometry/viewport.js";
import { contourSet } from "../helpers/fixtures.js";

const square = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2]
];

// A wide shape: 10 across, 2 tall, centred bounds (5, 1).
const wide = [
  [0, 0],
  [10, 0],
  [10, 2],
  [0, 2]
];

// === boundingBox ===

test("boundingBox returns null when there are no points", () => {
  assert.equal(boundingBox([]), null);
  assert.equal(boundingBox([[]]), null);
});

test("boundingBox bounds a single point as a zero-size box", () => {
  assert.deepEqual(boundingBox([[[3, 4]]]), { minX: 3, minY: 4, maxX: 3, maxY: 4 });
});

test("boundingBox spans across multiple contours", () => {
  const bb = boundingBox([square, [[-1, 5], [8, -3]]]);
  assert.deepEqual(bb, { minX: -1, minY: -3, maxX: 8, maxY: 5 });
});

// === computeViewBox: full ===

test("full mode frames the whole source image regardless of the shape", () => {
  const box = computeViewBox(contourSet([square], 64, 48), { mode: "full" });
  assert.deepEqual(box, { x: 0, y: 0, width: 64, height: 48 });
});

test("mode defaults to full", () => {
  const box = computeViewBox(contourSet([square], 10, 10));
  assert.deepEqual(box, { x: 0, y: 0, width: 10, height: 10 });
});

// === computeViewBox: crop ===

test("crop mode tightens to the shape bounds", () => {
  const box = computeViewBox(contourSet([wide], 64, 48), { mode: "crop" });
  assert.deepEqual(box, { x: 0, y: 0, width: 10, height: 2 });
});

test("crop falls back to the full image when nothing is traced", () => {
  const box = computeViewBox(contourSet([], 20, 12), { mode: "crop" });
  assert.deepEqual(box, { x: 0, y: 0, width: 20, height: 12 });
});

// === computeViewBox: aspect ratio (contain) ===

test("a ratio expands the shorter axis outward, centred", () => {
  // wide is 10x2 centred at (5,1); 1:1 grows height to 10 around the centre.
  const box = computeViewBox(contourSet([wide], 64, 48), { mode: "1:1" });
  assert.deepEqual(box, { x: 0, y: -4, width: 10, height: 10 });
});

test("a ratio widens a tall shape, centred", () => {
  const tall = [[0, 0], [2, 0], [2, 10], [0, 10]]; // 2x10 centred at (1,5)
  const box = computeViewBox(contourSet([tall], 64, 48), { mode: "1:1" });
  assert.deepEqual(box, { x: -4, y: 0, width: 10, height: 10 });
});

test("contain invariant: the shape bounds always fit inside the viewBox", () => {
  for (const mode of ["1:1", "16:9", "4:3", "9:16", "3:2"]) {
    const box = computeViewBox(contourSet([wide], 64, 48), { mode });
    assert.ok(box.x <= 0, `${mode}: left edge contains shape`);
    assert.ok(box.y <= 0, `${mode}: top edge contains shape`);
    assert.ok(box.x + box.width >= 10, `${mode}: right edge contains shape`);
    assert.ok(box.y + box.height >= 2, `${mode}: bottom edge contains shape`);
    const ratio = box.width / box.height;
    const [rw, rh] = mode.split(":").map(Number);
    assert.ok(Math.abs(ratio - rw / rh) < 1e-9, `${mode}: viewBox matches target ratio`);
  }
});

test("a ratio already matching the shape is a no-op", () => {
  const box = computeViewBox(contourSet([square], 64, 48), { mode: "1:1" });
  assert.deepEqual(box, { x: 0, y: 0, width: 2, height: 2 });
});

test("a ratio falls back to the full image when nothing is traced", () => {
  const box = computeViewBox(contourSet([], 20, 12), { mode: "16:9" });
  assert.deepEqual(box, { x: 0, y: 0, width: 20, height: 12 });
});

test("a degenerate (zero-area) shape falls back to the full image for a ratio", () => {
  const box = computeViewBox(contourSet([[[5, 5]]], 20, 12), { mode: "16:9" });
  assert.deepEqual(box, { x: 0, y: 0, width: 20, height: 12 });
});

test("an unrecognised mode degrades to a tight crop of the shape", () => {
  const box = computeViewBox(contourSet([wide], 64, 48), { mode: "banana" });
  assert.deepEqual(box, { x: 0, y: 0, width: 10, height: 2 });
});

// === computeViewBox: padding ===

test("padding outsets the box symmetrically on every side", () => {
  const box = computeViewBox(contourSet([wide], 64, 48), { mode: "crop", padding: 5 });
  assert.deepEqual(box, { x: -5, y: -5, width: 20, height: 12 });
});

test("padding applies in full mode too", () => {
  const box = computeViewBox(contourSet([square], 10, 10), { mode: "full", padding: 2 });
  assert.deepEqual(box, { x: -2, y: -2, width: 14, height: 14 });
});
