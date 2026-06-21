import test from "node:test";
import assert from "node:assert/strict";

import { svgPath } from "../../../src/plugins/export/svg-path.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { contourSet } from "../../helpers/fixtures.js";

const square = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2]
];

test("satisfies the plugin contract", () => {
  assertPluginContract(svgPath);
});

test("describes itself with kind, mime, and filename", () => {
  const out = svgPath.run(contourSet([square], 2, 2));
  assert.equal(out.kind, "svg");
  assert.equal(out.mime, "image/svg+xml");
  assert.equal(out.filename, "shadowpath.svg");
});

test("sizes the viewBox to the source dimensions", () => {
  const out = svgPath.run(contourSet([square], 64, 48));
  assert.match(out.text, /viewBox="0 0 64 48"/);
});

test("emits a single even-odd path with a move and a close", () => {
  const out = svgPath.run(contourSet([square], 2, 2));
  assert.equal((out.text.match(/<path /g) || []).length, 1);
  assert.match(out.text, /fill-rule="evenodd"/);
  assert.match(out.text, /d="M 0 0 L 2 0 L 2 2 L 0 2 Z"/);
});

test("concatenates multiple contours into one path", () => {
  const out = svgPath.run(contourSet([square, square], 2, 2));
  assert.equal((out.text.match(/<path /g) || []).length, 1);
  assert.equal((out.text.match(/Z/g) || []).length, 2, "one close per contour");
});

test("rounds coordinates to two decimals", () => {
  const out = svgPath.run(contourSet([[[0.123, 1.005], [2, 0], [2, 2]]], 2, 2));
  assert.match(out.text, /M 0.12 1/);
  assert.ok(!out.text.includes("0.123"));
});

test("an empty contour set still yields valid SVG with an empty path", () => {
  const out = svgPath.run(contourSet([], 10, 10));
  assert.match(out.text, /^<svg/);
  assert.match(out.text, /d=""/);
});
