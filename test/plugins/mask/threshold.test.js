import test from "node:test";
import assert from "node:assert/strict";

import { thresholdMask } from "../../../src/plugins/mask/threshold.js";
import { defaultParams } from "../../../src/core/pipeline.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { rgbaImage } from "../../helpers/fixtures.js";

const run = (image, params = {}) =>
  thresholdMask.run(image, { ...defaultParams(thresholdMask), ...params });

test("satisfies the plugin contract", () => {
  assertPluginContract(thresholdMask);
});

test("marks dark pixels as foreground below the threshold", () => {
  const image = rgbaImage(2, 1, (x) => (x === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
  const mask = run(image, { threshold: 150 });
  assert.deepEqual([...mask.data], [1, 0]);
  assert.equal(mask.width, 2);
  assert.equal(mask.height, 1);
});

test("threshold comparison is inclusive of the boundary value", () => {
  // A mid-grey whose luminance is exactly 150.
  const image = rgbaImage(1, 1, () => [150, 150, 150, 255]);
  assert.equal(run(image, { threshold: 150 }).data[0], 1, "lightness <= threshold is filled");
  assert.equal(run(image, { threshold: 149 }).data[0], 0);
});

test("invert traces light areas instead of dark", () => {
  const image = rgbaImage(2, 1, (x) => (x === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
  const mask = run(image, { threshold: 150, invert: true });
  assert.deepEqual([...mask.data], [0, 1]);
});

test("transparent pixels are excluded when the option is on", () => {
  // A black-but-transparent pixel: dark enough to fill, but alpha below 16.
  const image = rgbaImage(1, 1, () => [0, 0, 0, 8]);
  assert.equal(run(image, { transparentBg: true }).data[0], 0);
  assert.equal(run(image, { transparentBg: false }).data[0], 1);
});

test("luminance weights green more heavily than red", () => {
  // Pure red (lum ~54) and pure green (lum ~182) bracket a threshold of 100.
  const reds = rgbaImage(1, 1, () => [255, 0, 0, 255]);
  const greens = rgbaImage(1, 1, () => [0, 255, 0, 255]);
  assert.equal(run(reds, { threshold: 100 }).data[0], 1, "dark red is foreground");
  assert.equal(run(greens, { threshold: 100 }).data[0], 0, "bright green is background");
});
