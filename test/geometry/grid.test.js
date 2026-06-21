import test from "node:test";
import assert from "node:assert/strict";

import { snapPoint, snapContour, rectilinearize, chamferize, hashJitter } from "../../src/geometry/grid.js";

test("snapPoint rounds to the nearest grid intersection", () => {
  assert.deepEqual(snapPoint([3, 5], 4), [4, 4]);
  assert.deepEqual(snapPoint([2, 2], 4), [4, 4]); // halfway rounds up
  assert.deepEqual(snapPoint([0, 0], 4), [0, 0]);
});

test("snapPoint honours the grid offset", () => {
  assert.deepEqual(snapPoint([2, 2], 4, 1), [1, 1]); // lattice at 1, 5, 9, ...
  assert.deepEqual(snapPoint([4, 4], 4, 1), [5, 5]);
});

test("snapContour lands every point on the grid", () => {
  const snapped = snapContour([[1, 1], [11, 2], [9, 9], [2, 10]], 4);
  for (const [x, y] of snapped) {
    assert.equal(x % 4, 0);
    assert.equal(y % 4, 0);
  }
});

test("snapContour collapses points that snap onto each other", () => {
  // Two near points snap to the same cell and must not both survive.
  const snapped = snapContour([[0, 0], [1, 1], [10, 0], [10, 10], [0, 10]], 4);
  for (let index = 0; index < snapped.length; index += 1) {
    const next = snapped[(index + 1) % snapped.length];
    assert.notDeepEqual(snapped[index], next);
  }
});

test("snapContour drops a closing point that snaps onto the first", () => {
  // The last point snaps to [0, 0], coinciding with the first; it must not
  // survive as a duplicate closing vertex.
  const snapped = snapContour([[0, 0], [8, 0], [8, 8], [1, 1]], 8);
  assert.deepEqual(snapped, [[0, 0], [8, 0], [8, 8]]);
});

test("rectilinearize emits only horizontal or vertical edges", () => {
  const result = rectilinearize([[0, 0], [10, 6], [0, 12]], 2);
  for (let index = 0; index < result.length; index += 1) {
    const start = result[index];
    const end = result[(index + 1) % result.length];
    const sharesAxis = start[0] === end[0] || start[1] === end[1];
    assert.ok(sharesAxis, `edge ${index} is diagonal: ${start} -> ${end}`);
  }
});

test("chamferize keeps clean 45-degree edges when allowed", () => {
  // A perfect diagonal square (a diamond) on the grid stays diagonal.
  const diamond = [[4, 0], [8, 4], [4, 8], [0, 4]];
  const result = chamferize(diamond, 4, true);
  assert.deepEqual(result, diamond);
});

test("chamferize breaks 45-degree edges into steps when diagonals disallowed", () => {
  const diamond = [[4, 0], [8, 4], [4, 8], [0, 4]];
  const stepped = chamferize(diamond, 4, false);
  for (let index = 0; index < stepped.length; index += 1) {
    const start = stepped[index];
    const end = stepped[(index + 1) % stepped.length];
    assert.ok(start[0] === end[0] || start[1] === end[1]);
  }
});

test("hashJitter is deterministic for the same inputs", () => {
  assert.equal(hashJitter(3, 7, 1), hashJitter(3, 7, 1));
});

test("hashJitter varies with coordinates and seed", () => {
  assert.notEqual(hashJitter(3, 7, 1), hashJitter(4, 7, 1));
  assert.notEqual(hashJitter(3, 7, 1), hashJitter(3, 7, 2));
});

test("hashJitter stays within [-1, 1]", () => {
  for (let index = 0; index < 50; index += 1) {
    const value = hashJitter(index, index * 3, index % 5);
    assert.ok(value >= -1 && value <= 1, `out of range: ${value}`);
  }
});
