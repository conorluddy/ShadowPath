import test from "node:test";
import assert from "node:assert/strict";

import {
  builtinPlugins,
  createDefaultRegistry,
  DEFAULT_PIPELINE,
  activePlugins
} from "../src/shadowpath.js";
import { assertPluginContract } from "./helpers/plugin-contract.js";

test("every built-in plugin satisfies the contract", () => {
  for (const plugin of builtinPlugins) {
    assertPluginContract(plugin);
  }
});

test("built-in plugin ids are unique within each kind", () => {
  const seen = new Set();
  for (const plugin of builtinPlugins) {
    const key = `${plugin.kind}:${plugin.id}`;
    assert.ok(!seen.has(key), `duplicate ${key}`);
    seen.add(key);
  }
});

test("the default registry resolves every stage in the default pipeline", () => {
  const registry = createDefaultRegistry();
  assert.doesNotThrow(() => activePlugins(registry, DEFAULT_PIPELINE));
});

test("the default pipeline wires the five built-in stages in order", () => {
  const registry = createDefaultRegistry();
  const ids = activePlugins(registry, DEFAULT_PIPELINE).map((p) => p.id);
  assert.deepEqual(ids, ["threshold", "edge-trace", "simplify", "smooth", "svg-path"]);
});
