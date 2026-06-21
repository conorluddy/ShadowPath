import test from "node:test";
import assert from "node:assert/strict";

import { smooth } from "../../../src/plugins/process/smooth.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { contourSet } from "../../helpers/fixtures.js";

const square = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10]
];

test("satisfies the plugin contract", () => {
  assertPluginContract(smooth);
});

test("zero passes leaves the contour unchanged", () => {
  const result = smooth.run(contourSet([square]), { passes: 0 });
  assert.deepEqual(result.paths[0], square);
});

test("each pass increases the point count", () => {
  const once = smooth.run(contourSet([square]), { passes: 1 });
  const twice = smooth.run(contourSet([square]), { passes: 2 });
  assert.equal(once.paths[0].length, 8);
  assert.equal(twice.paths[0].length, 16);
});

test("smoothed points stay within the original bounds", () => {
  const result = smooth.run(contourSet([square]), { passes: 3 });
  for (const [x, y] of result.paths[0]) {
    assert.ok(x >= 0 && x <= 10 && y >= 0 && y <= 10);
  }
});

test("preserves the source dimensions", () => {
  const result = smooth.run(contourSet([square], 40, 50), { passes: 1 });
  assert.equal(result.width, 40);
  assert.equal(result.height, 50);
});

test("an empty contour set stays empty", () => {
  const result = smooth.run(contourSet([]), { passes: 2 });
  assert.deepEqual(result.paths, []);
});
