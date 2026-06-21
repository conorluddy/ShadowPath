import test from "node:test";
import assert from "node:assert/strict";

import { gridSnap } from "../../../src/plugins/process/grid-snap.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { contourSet } from "../../helpers/fixtures.js";

const square = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10]
];

test("satisfies the plugin contract", () => {
  assertPluginContract(gridSnap);
});

test("preserves the source dimensions", () => {
  const result = gridSnap.run(contourSet([square], 32, 24), { cell: 4, offset: 0 });
  assert.equal(result.width, 32);
  assert.equal(result.height, 24);
});

test("snaps every point onto the grid", () => {
  const wobbly = [[1, 1], [11, 2], [9, 9], [2, 10]];
  const result = gridSnap.run(contourSet([wobbly]), { cell: 4, offset: 0 });
  for (const [x, y] of result.paths[0]) {
    assert.equal(x % 4, 0);
    assert.equal(y % 4, 0);
  }
});

test("drops contours that collapse below meaningful area", () => {
  const speck = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const result = gridSnap.run(contourSet([speck]), { cell: 32, offset: 0 });
  assert.equal(result.paths.length, 0);
});

test("handles an empty contour set", () => {
  const result = gridSnap.run(contourSet([]), { cell: 4, offset: 0 });
  assert.deepEqual(result.paths, []);
});
