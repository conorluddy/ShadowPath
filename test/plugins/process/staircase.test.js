import test from "node:test";
import assert from "node:assert/strict";

import { staircase } from "../../../src/plugins/process/staircase.js";
import { assertPluginContract } from "../../helpers/plugin-contract.js";
import { contourSet } from "../../helpers/fixtures.js";

const triangle = [
  [0, 0],
  [12, 6],
  [0, 12]
];

test("satisfies the plugin contract", () => {
  assertPluginContract(staircase);
});

test("preserves the source dimensions", () => {
  const result = staircase.run(contourSet([triangle], 40, 30), { cell: 2 });
  assert.equal(result.width, 40);
  assert.equal(result.height, 30);
});

test("produces only horizontal and vertical edges", () => {
  const result = staircase.run(contourSet([triangle]), { cell: 2 });
  const path = result.paths[0];
  for (let index = 0; index < path.length; index += 1) {
    const start = path[index];
    const end = path[(index + 1) % path.length];
    assert.ok(start[0] === end[0] || start[1] === end[1], `diagonal edge: ${start} -> ${end}`);
  }
});

test("handles an empty contour set", () => {
  const result = staircase.run(contourSet([]), { cell: 2 });
  assert.deepEqual(result.paths, []);
});
