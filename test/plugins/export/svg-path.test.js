import test from "node:test";
import assert from "node:assert/strict";

import { svgPath } from "../../../src/plugins/export/svg-path.js";
import { defaultParams } from "../../../src/core/pipeline.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { contourSet } from "../../helpers/fixtures.js";

const square = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2]
];

const run = (contours, params = {}) =>
  svgPath.run(contours, { ...defaultParams(svgPath), ...params });

test("satisfies the plugin contract", () => {
  assertPluginContract(svgPath);
});

test("describes itself with kind, mime, and filename", () => {
  const out = run(contourSet([square], 2, 2));
  assert.equal(out.kind, "svg");
  assert.equal(out.mime, "image/svg+xml");
  assert.equal(out.filename, "shadowpath.svg");
});

test("defaults to a full-image viewBox sized to the source dimensions", () => {
  const out = run(contourSet([square], 64, 48));
  assert.match(out.text, /viewBox="0 0 64 48"/);
});

test("crop mode tightens the viewBox to the shape bounds", () => {
  const wide = [[2, 3], [12, 3], [12, 7], [2, 7]];
  const out = run(contourSet([wide], 64, 48), { canvas: "crop" });
  assert.match(out.text, /viewBox="2 3 10 4"/);
});

test("padding outsets the cropped viewBox", () => {
  const wide = [[2, 3], [12, 3], [12, 7], [2, 7]];
  const out = run(contourSet([wide], 64, 48), { canvas: "crop", padding: 5 });
  assert.match(out.text, /viewBox="-3 -2 20 14"/);
});

test("an aspect-ratio preset frames the shape at the target ratio", () => {
  const wide = [[0, 0], [10, 0], [10, 2], [0, 2]]; // 10x2, centred at (5,1)
  const out = run(contourSet([wide], 64, 48), { canvas: "1:1" });
  assert.match(out.text, /viewBox="0 -4 10 10"/);
});

test("emits a single even-odd path with a move and a close", () => {
  const out = run(contourSet([square], 2, 2));
  assert.equal((out.text.match(/<path /g) || []).length, 1);
  assert.match(out.text, /fill-rule="evenodd"/);
  assert.match(out.text, /d="M 0 0 L 2 0 L 2 2 L 0 2 Z"/);
});

test("concatenates multiple contours into one path", () => {
  const out = run(contourSet([square, square], 2, 2));
  assert.equal((out.text.match(/<path /g) || []).length, 1);
  assert.equal((out.text.match(/Z/g) || []).length, 2, "one close per contour");
});

test("rounds coordinates to two decimals", () => {
  const out = run(contourSet([[[0.123, 1.005], [2, 0], [2, 2]]], 2, 2));
  assert.match(out.text, /M 0.12 1/);
  assert.ok(!out.text.includes("0.123"));
});

test("an empty contour set still yields valid SVG with an empty path", () => {
  const out = run(contourSet([], 10, 10));
  assert.match(out.text, /^<svg/);
  assert.match(out.text, /d=""/);
});
