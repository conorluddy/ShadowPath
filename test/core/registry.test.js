import test from "node:test";
import assert from "node:assert/strict";

import { createRegistry } from "../../src/core/registry.js";

const stub = (overrides = {}) => ({
  id: "stub",
  kind: "mask",
  label: "Stub",
  run: () => null,
  ...overrides
});

test("register and get round-trips a plugin", () => {
  const registry = createRegistry();
  const plugin = stub();
  assert.equal(registry.register(plugin), plugin, "register returns the plugin");
  assert.equal(registry.get("mask", "stub"), plugin);
});

test("register rejects a plugin without a run function", () => {
  const registry = createRegistry();
  assert.throws(() => registry.register(stub({ run: undefined })), /run\(\) function/);
});

test("register rejects an unknown kind", () => {
  const registry = createRegistry();
  assert.throws(() => registry.register(stub({ kind: "nonsense" })), /Unknown plugin kind/);
});

test("register rejects a duplicate id within the same kind", () => {
  const registry = createRegistry();
  registry.register(stub());
  assert.throws(() => registry.register(stub()), /Duplicate plugin id/);
});

test("the same id is allowed across different kinds", () => {
  const registry = createRegistry();
  registry.register(stub({ kind: "mask", id: "shared" }));
  assert.doesNotThrow(() => registry.register(stub({ kind: "trace", id: "shared" })));
});

test("get throws a helpful error for a missing plugin", () => {
  const registry = createRegistry();
  assert.throws(() => registry.get("mask", "ghost"), /No "mask" plugin registered with id "ghost"/);
});

test("list returns registered plugins for a kind", () => {
  const registry = createRegistry();
  registry.register(stub({ id: "a" }));
  registry.register(stub({ id: "b" }));
  assert.deepEqual(registry.list("mask").map((p) => p.id), ["a", "b"]);
});

test("list returns an empty array for an empty or unknown kind", () => {
  const registry = createRegistry();
  assert.deepEqual(registry.list("process"), []);
  assert.deepEqual(registry.list("unknown"), []);
});
