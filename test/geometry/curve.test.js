import test from "node:test";
import assert from "node:assert/strict";

import { catmullRomToBezier } from "../../src/geometry/curve.js";

const square = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10]
];

const approx = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ~= ${expected}`);

test("fewer than three points yields no segments", () => {
  assert.deepEqual(catmullRomToBezier([], 1), []);
  assert.deepEqual(catmullRomToBezier([[0, 0]], 1), []);
  assert.deepEqual(catmullRomToBezier([[0, 0], [1, 1]], 1), []);
});

test("a closed contour produces one segment per point", () => {
  assert.equal(catmullRomToBezier(square, 1).length, 4);
  assert.equal(catmullRomToBezier([[0, 0], [2, 0], [1, 2]], 1).length, 3);
});

test("each segment ends on the next vertex (the spline interpolates)", () => {
  const segments = catmullRomToBezier(square, 1);
  assert.deepEqual(segments.map((s) => s.end), [
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0]
  ]);
});

test("zero tension collapses control points onto the segment endpoints", () => {
  const segments = catmullRomToBezier(square, 0);
  segments.forEach((segment, i) => {
    assert.deepEqual(segment.c1, square[i], "first control point sits on the start vertex");
    assert.deepEqual(segment.c2, segment.end, "second control point sits on the end vertex");
  });
});

test("unit tension places control points a sixth of the way along neighbours", () => {
  // Segment 0 of the square: P0=[0,10] P1=[0,0] P2=[10,0] P3=[10,10], k = 1/6.
  const [seg] = catmullRomToBezier(square, 1);
  approx(seg.c1[0], 10 / 6);
  approx(seg.c1[1], -10 / 6);
  approx(seg.c2[0], 10 - 10 / 6);
  approx(seg.c2[1], -10 / 6);
  assert.deepEqual(seg.end, [10, 0]);
});
