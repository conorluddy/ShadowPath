import test from "node:test";
import assert from "node:assert/strict";

import {
  pointKey,
  polygonArea,
  removeCollinear,
  simplifyClosedPath,
  smoothClosedPath,
  isMeaningfulContour
} from "../../src/geometry/contour.js";

const square = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2]
];

test("pointKey formats a coordinate pair", () => {
  assert.equal(pointKey(3, 4), "3,4");
  assert.equal(pointKey(0, 0), "0,0");
});

test("polygonArea: empty and single-point polygons have zero area", () => {
  assert.equal(polygonArea([]), 0);
  assert.equal(polygonArea([[1, 1]]), 0);
});

test("polygonArea: counter-clockwise winding is positive, clockwise negative", () => {
  assert.equal(polygonArea(square), 4);
  assert.equal(polygonArea([...square].reverse()), -4);
});

test("polygonArea: matches the shoelace result for a triangle", () => {
  assert.equal(polygonArea([[0, 0], [4, 0], [0, 3]]), 6);
});

test("removeCollinear: returns a copy for fewer than four points", () => {
  const tri = [[0, 0], [1, 0], [0, 1]];
  const result = removeCollinear(tri);
  assert.deepEqual(result, tri);
  assert.notEqual(result, tri, "must be a fresh array");
});

test("removeCollinear: drops midpoints on straight edges", () => {
  const withMidpoints = [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
    [1, 2],
    [0, 2],
    [0, 1]
  ];
  assert.deepEqual(removeCollinear(withMidpoints), square);
});

test("removeCollinear: a fully collinear loop collapses to nothing", () => {
  const line = [[0, 0], [1, 0], [2, 0], [3, 0]];
  assert.deepEqual(removeCollinear(line), []);
});

test("simplifyClosedPath: non-positive epsilon returns an unchanged copy", () => {
  const result = simplifyClosedPath(square, 0);
  assert.deepEqual(result, square);
  assert.notEqual(result, square);
});

test("simplifyClosedPath: fewer than four points returns a copy", () => {
  const tri = [[0, 0], [4, 0], [0, 4]];
  assert.deepEqual(simplifyClosedPath(tri, 2), tri);
});

test("simplifyClosedPath: removes a near-collinear point within tolerance", () => {
  const nearlyStraight = [
    [0, 0],
    [5, 0.4],
    [10, 0],
    [10, 10],
    [0, 10]
  ];
  const result = simplifyClosedPath(nearlyStraight, 1);
  assert.ok(result.length < nearlyStraight.length);
  assert.ok(!result.some(([x, y]) => x === 5 && y === 0.4));
});

test("smoothClosedPath: zero iterations returns an unchanged copy", () => {
  const result = smoothClosedPath(square, 0);
  assert.deepEqual(result, square);
  assert.notEqual(result, square);
});

test("smoothClosedPath: each pass doubles the point count", () => {
  assert.equal(smoothClosedPath(square, 1).length, 8);
  assert.equal(smoothClosedPath(square, 2).length, 16);
});

test("smoothClosedPath: smoothed points stay within the bounding box", () => {
  const result = smoothClosedPath(square, 3);
  for (const [x, y] of result) {
    assert.ok(x >= 0 && x <= 2 && y >= 0 && y <= 2);
  }
});

test("smoothClosedPath: refuses to grow beyond the safety cap", () => {
  // Eleven passes would explode past 12000 points; the cap halts it earlier.
  const result = smoothClosedPath(square, 20);
  assert.ok(result.length <= 12000 * 2);
});

test("isMeaningfulContour: rejects degenerate shapes", () => {
  assert.equal(isMeaningfulContour([]), false);
  assert.equal(isMeaningfulContour([[0, 0], [1, 0]]), false);
  assert.equal(isMeaningfulContour([[0, 0], [0.5, 0], [1, 0]]), false, "zero area");
  assert.equal(isMeaningfulContour(square), true);
});
