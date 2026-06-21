import test from "node:test";
import assert from "node:assert/strict";

import { moveItem } from "../../src/ui/reorder.js";

test("moves an item forward", () => {
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 0, 2), ["b", "c", "a", "d"]);
});

test("moves an item backward", () => {
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 3, 1), ["a", "d", "b", "c"]);
});

test("a no-op move returns an equal copy", () => {
  const input = ["a", "b", "c"];
  const result = moveItem(input, 1, 1);
  assert.deepEqual(result, input);
  assert.notEqual(result, input, "must not mutate or return the same array");
});

test("does not mutate the source array", () => {
  const input = ["a", "b", "c"];
  moveItem(input, 0, 2);
  assert.deepEqual(input, ["a", "b", "c"]);
});

test("clamps an out-of-range destination to the end", () => {
  assert.deepEqual(moveItem(["a", "b", "c"], 0, 99), ["b", "c", "a"]);
});

test("clamps an out-of-range source to the last item", () => {
  assert.deepEqual(moveItem(["a", "b", "c"], -5, 0), ["a", "b", "c"]);
});
