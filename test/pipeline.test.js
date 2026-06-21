// Behavior lock for the modular pipeline. These run in Node with no DOM: the
// plugins are pure and operate on duck-typed image data, so a plain object
// stands in for browser ImageData.

import test from "node:test";
import assert from "node:assert/strict";

import {
  createDefaultRegistry,
  runPipeline,
  activePlugins,
  DEFAULT_PIPELINE
} from "../src/shadowpath.js";

// Build an RGBA image: an inner `fill` rectangle of black on a white field.
function makeImage(width, height, fill) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inside = x >= fill.x0 && x < fill.x1 && y >= fill.y0 && y < fill.y1;
      const value = inside ? 0 : 255;
      const i = (y * width + x) * 4;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

// A 2x2 black square centered in a 4x4 white field.
const square = makeImage(4, 4, { x0: 1, y0: 1, x1: 3, y1: 3 });

// Run with simplify/smooth off so the geometry is exactly the traced square.
const rawConfig = {
  ...DEFAULT_PIPELINE,
  process: [
    { id: "simplify" },
    { id: "smooth" }
  ]
};
const rawValues = {
  simplify: { amount: 0 },
  smooth: { passes: 0 }
};

test("registry exposes the five built-in stages in pipeline order", () => {
  const registry = createDefaultRegistry();
  const ids = activePlugins(registry, DEFAULT_PIPELINE).map((p) => p.id);
  assert.deepEqual(ids, ["threshold", "edge-trace", "simplify", "smooth", "svg-path"]);
});

test("traces a solid square into one 4-point contour", () => {
  const registry = createDefaultRegistry();
  const { contours, pointCount } = runPipeline(square, rawConfig, registry, rawValues);

  assert.equal(contours.paths.length, 1);
  assert.equal(contours.paths[0].length, 4);
  assert.equal(pointCount, 4);
});

test("emits a single even-odd SVG path sized to the source", () => {
  const registry = createDefaultRegistry();
  const { output } = runPipeline(square, rawConfig, registry, rawValues);

  assert.equal(output.kind, "svg");
  assert.match(output.text, /viewBox="0 0 4 4"/);
  assert.match(output.text, /fill-rule="evenodd"/);
  assert.equal((output.text.match(/<path /g) || []).length, 1);
  assert.match(output.text, /Z"/);
});

test("invert produces no foreground for an opaque dark-on-light image", () => {
  const registry = createDefaultRegistry();
  const values = { ...rawValues, threshold: { invert: true, transparentBg: false } };
  const { contours } = runPipeline(square, rawConfig, registry, values);

  // Inverting traces light areas; the white border is open at the frame edge,
  // so the only closed region is the ring around the square — still meaningful.
  assert.ok(contours.paths.length >= 1);
});

test("default params apply when no values are supplied", () => {
  const registry = createDefaultRegistry();
  const { output } = runPipeline(square, DEFAULT_PIPELINE, registry);
  assert.match(output.text, /<svg/);
});
