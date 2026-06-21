import test from "node:test";
import assert from "node:assert/strict";

import { simplify } from "../../../src/plugins/process/simplify.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { contourSet } from "../../helpers/fixtures.js";

const square = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10]
];

test("satisfies the plugin contract", () => {
  assertPluginContract(simplify);
});

test("preserves the source dimensions", () => {
  const result = simplify.run(contourSet([square], 32, 24), { amount: 1 });
  assert.equal(result.width, 32);
  assert.equal(result.height, 24);
});

test("an amount of zero leaves a clean square unchanged", () => {
  const result = simplify.run(contourSet([square]), { amount: 0 });
  assert.deepEqual(result.paths[0], square);
});

test("removes points that fall within the tolerance", () => {
  const bumpy = [
    [0, 0],
    [5, 0.3],
    [10, 0],
    [10, 10],
    [0, 10]
  ];
  const result = simplify.run(contourSet([bumpy]), { amount: 1 });
  assert.ok(result.paths[0].length < bumpy.length);
});

test("drops contours that simplify into something degenerate", () => {
  const sliver = [
    [0, 0],
    [10, 0],
    [10, 0.1],
    [0, 0.1]
  ];
  const result = simplify.run(contourSet([sliver]), { amount: 5 });
  assert.equal(result.paths.length, 0);
});

test("an empty contour set stays empty", () => {
  const result = simplify.run(contourSet([]), { amount: 2 });
  assert.deepEqual(result.paths, []);
});
