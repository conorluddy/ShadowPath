import test from "node:test";
import assert from "node:assert/strict";

import { chamfer } from "../../../src/plugins/process/chamfer.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { contourSet } from "../../helpers/fixtures.js";

const diamond = [
  [4, 0],
  [8, 4],
  [4, 8],
  [0, 4]
];

test("satisfies the plugin contract", () => {
  assertPluginContract(chamfer);
});

test("preserves the source dimensions", () => {
  const result = chamfer.run(contourSet([diamond], 24, 24), { cell: 4, allowDiagonal: true });
  assert.equal(result.width, 24);
  assert.equal(result.height, 24);
});

test("keeps a clean 45-degree diamond intact when diagonals allowed", () => {
  const result = chamfer.run(contourSet([diamond]), { cell: 4, allowDiagonal: true });
  assert.deepEqual(result.paths[0], diamond);
});

test("steps the diamond into axis-aligned edges when diagonals disallowed", () => {
  const result = chamfer.run(contourSet([diamond]), { cell: 4, allowDiagonal: false });
  const path = result.paths[0];
  for (let index = 0; index < path.length; index += 1) {
    const start = path[index];
    const end = path[(index + 1) % path.length];
    assert.ok(start[0] === end[0] || start[1] === end[1], `diagonal survived: ${start} -> ${end}`);
  }
});

test("handles an empty contour set", () => {
  const result = chamfer.run(contourSet([]), { cell: 4, allowDiagonal: true });
  assert.deepEqual(result.paths, []);
});
