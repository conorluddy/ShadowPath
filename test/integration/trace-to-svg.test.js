// End-to-end: a real image through the real default pipeline. The per-module
// specs cover the edges; this proves the stages compose into the v0.0.1 output.

import test from "node:test";
import assert from "node:assert/strict";

import { createDefaultRegistry, runPipeline, DEFAULT_PIPELINE } from "../../src/shadowpath.js";
import { imageFromAscii } from "../helpers/fixtures.js";

// A 2x2 black square centred in a 4x4 white field.
const square = imageFromAscii([
  "....",
  ".##.",
  ".##.",
  "...."
]);

// Simplify/smooth off so the geometry is exactly the traced square.
const rawValues = { simplify: { amount: 0 }, smooth: { passes: 0 } };

test("traces a solid square into one four-point contour", () => {
  const registry = createDefaultRegistry();
  const { contours, pointCount } = runPipeline(square, DEFAULT_PIPELINE, registry, rawValues);
  assert.equal(contours.paths.length, 1);
  assert.equal(contours.paths[0].length, 4);
  assert.equal(pointCount, 4);
});

test("emits one even-odd SVG path sized to the source", () => {
  const registry = createDefaultRegistry();
  const { output } = runPipeline(square, DEFAULT_PIPELINE, registry, rawValues);
  assert.equal(output.kind, "svg");
  assert.match(output.text, /viewBox="0 0 4 4"/);
  assert.match(output.text, /fill-rule="evenodd"/);
  assert.equal((output.text.match(/<path /g) || []).length, 1);
});

test("default params produce a valid trace with no overrides", () => {
  const registry = createDefaultRegistry();
  const { output } = runPipeline(square, DEFAULT_PIPELINE, registry);
  assert.match(output.text, /^<svg/);
});

test("an all-white image yields no paths and an empty SVG path", () => {
  const registry = createDefaultRegistry();
  const blank = imageFromAscii([
    "....",
    "....",
    "...."
  ]);
  const { contours, output } = runPipeline(blank, DEFAULT_PIPELINE, registry);
  assert.equal(contours.paths.length, 0);
  assert.match(output.text, /d=""/);
});
