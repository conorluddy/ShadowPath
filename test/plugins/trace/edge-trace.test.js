import test from "node:test";
import assert from "node:assert/strict";

import { edgeTrace } from "../../../src/plugins/trace/edge-trace.js";
import { polygonArea } from "../../../src/geometry/contour.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { maskFromAscii } from "../../helpers/fixtures.js";

test("satisfies the plugin contract", () => {
  assertPluginContract(edgeTrace);
});

test("an empty mask produces no contours", () => {
  const mask = maskFromAscii([
    "...",
    "...",
    "..."
  ]);
  assert.deepEqual(edgeTrace.run(mask).paths, []);
});

test("a single pixel becomes one square contour of four corners", () => {
  const mask = maskFromAscii([
    "...",
    ".#.",
    "..."
  ]);
  const { paths, width, height } = edgeTrace.run(mask);
  assert.equal(paths.length, 1);
  assert.equal(paths[0].length, 4);
  assert.equal(Math.abs(polygonArea(paths[0])), 1);
  assert.equal(width, 3);
  assert.equal(height, 3);
});

test("a solid block traces to a single rectangular contour", () => {
  const mask = maskFromAscii([
    "....",
    ".##.",
    ".##.",
    "...."
  ]);
  const { paths } = edgeTrace.run(mask);
  assert.equal(paths.length, 1);
  assert.equal(paths[0].length, 4);
  assert.equal(Math.abs(polygonArea(paths[0])), 4);
});

test("a shape with a hole yields two oppositely wound contours", () => {
  const mask = maskFromAscii([
    "#####",
    "#...#",
    "#.#.#",
    "#...#",
    "#####"
  ]);
  const { paths } = edgeTrace.run(mask);
  assert.equal(paths.length, 3, "outer ring, inner hole, and the centre pixel");

  const areas = paths.map(polygonArea);
  assert.ok(areas.some((a) => a > 0), "at least one contour winds positive");
  assert.ok(areas.some((a) => a < 0), "the hole winds the opposite way");
});

test("two separate blocks trace as two contours", () => {
  const mask = maskFromAscii([
    "#..#",
    "#..#",
    "....",
    "...."
  ]);
  const { paths } = edgeTrace.run(mask);
  assert.equal(paths.length, 2);
});

test("a fully filled mask traces its outer boundary", () => {
  const mask = maskFromAscii([
    "##",
    "##"
  ]);
  const { paths } = edgeTrace.run(mask);
  assert.equal(paths.length, 1);
  assert.equal(Math.abs(polygonArea(paths[0])), 4);
});
