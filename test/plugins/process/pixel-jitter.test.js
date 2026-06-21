import test from "node:test";
import assert from "node:assert/strict";

import { pixelJitter } from "../../../src/plugins/process/pixel-jitter.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { contourSet } from "../../helpers/fixtures.js";

const square = [
  [0, 0],
  [16, 0],
  [16, 16],
  [0, 16]
];

test("satisfies the plugin contract", () => {
  assertPluginContract(pixelJitter);
});

test("preserves the source dimensions", () => {
  const result = pixelJitter.run(contourSet([square], 32, 32), { cell: 4, amount: 1, seed: 0 });
  assert.equal(result.width, 32);
  assert.equal(result.height, 32);
});

test("zero jitter leaves the snapped contour unmoved", () => {
  const result = pixelJitter.run(contourSet([square]), { cell: 4, amount: 0, seed: 0 });
  assert.deepEqual(result.paths[0], square);
});

test("is deterministic for the same seed", () => {
  const first = pixelJitter.run(contourSet([square]), { cell: 4, amount: 2, seed: 7 });
  const second = pixelJitter.run(contourSet([square]), { cell: 4, amount: 2, seed: 7 });
  assert.deepEqual(first.paths, second.paths);
});

test("different seeds produce different output", () => {
  const first = pixelJitter.run(contourSet([square]), { cell: 4, amount: 2, seed: 1 });
  const second = pixelJitter.run(contourSet([square]), { cell: 4, amount: 2, seed: 2 });
  assert.notDeepEqual(first.paths, second.paths);
});

test("handles an empty contour set", () => {
  const result = pixelJitter.run(contourSet([]), { cell: 4, amount: 1, seed: 0 });
  assert.deepEqual(result.paths, []);
});
