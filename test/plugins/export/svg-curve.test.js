import test from "node:test";
import assert from "node:assert/strict";

import { svgCurve } from "../../../src/plugins/export/svg-curve.js";
import { defaultParams } from "../../../src/core/pipeline.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { contourSet } from "../../helpers/fixtures.js";

const square = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10]
];

const run = (contours, params = {}) =>
  svgCurve.run(contours, { ...defaultParams(svgCurve), ...params });

test("satisfies the plugin contract", () => {
  assertPluginContract(svgCurve);
});

test("describes itself with kind, mime, and filename", () => {
  const out = run(contourSet([square]));
  assert.equal(out.kind, "svg");
  assert.equal(out.mime, "image/svg+xml");
  assert.equal(out.filename, "shadowpath.svg");
});

test("defaults to a full-image viewBox sized to the source dimensions", () => {
  const out = run(contourSet([square], 64, 48));
  assert.match(out.text, /viewBox="0 0 64 48"/);
});

test("crop mode with padding tightens and outsets the viewBox", () => {
  const out = run(contourSet([square], 64, 48), { canvas: "crop", padding: 3 });
  assert.match(out.text, /viewBox="-3 -3 16 16"/);
});

test("an aspect-ratio preset frames the shape at the target ratio", () => {
  const wide = [[0, 0], [10, 0], [10, 2], [0, 2]]; // 10x2, centred at (5,1)
  const out = run(contourSet([wide], 64, 48), { canvas: "1:1" });
  assert.match(out.text, /viewBox="0 -4 10 10"/);
});

test("emits a single even-odd path built from cubic curves", () => {
  const out = run(contourSet([square], 10, 10));
  assert.equal((out.text.match(/<path /g) || []).length, 1);
  assert.match(out.text, /fill-rule="evenodd"/);
  assert.match(out.text, /d="M /);
  assert.match(out.text, / C /, "uses cubic Bézier commands");
});

test("closes one subpath per contour", () => {
  const out = run(contourSet([square, square], 10, 10));
  assert.equal((out.text.match(/Z/g) || []).length, 2);
});

test("zero tension yields straight cubic segments through the vertices", () => {
  const out = run(contourSet([square], 10, 10), { tension: 0 });
  assert.match(out.text, /M 0 0 C 0 0 10 0 10 0/);
});

test("rounds coordinates to at most two decimals", () => {
  const out = run(contourSet([square], 10, 10), { tension: 1 });
  assert.ok(!/\d\.\d{3,}/.test(out.text), "no coordinate keeps more than two decimals");
});

test("an empty contour set yields valid SVG with an empty path", () => {
  const out = run(contourSet([], 10, 10));
  assert.match(out.text, /^<svg/);
  assert.match(out.text, /d=""/);
});

test("contours with fewer than three points are skipped", () => {
  const out = run(contourSet([[[0, 0], [1, 0]]], 10, 10));
  assert.match(out.text, /d=""/);
});
