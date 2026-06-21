// The plugin contract conformance check. Every plugin — built-in or future —
// must satisfy this, so it doubles as living documentation of what "a plugin"
// is. Spec-driven development starts here: write the plugin's descriptor, run it
// through assertPluginContract, then drive its behavior with focused specs.

import assert from "node:assert/strict";

const VALID_KINDS = new Set(["mask", "trace", "process", "export"]);
const VALID_PARAM_TYPES = new Set(["range", "boolean"]);

/**
 * Assert that a plugin descriptor is well formed. Throws (via assert) on the
 * first violation so failures point at the exact problem.
 * @param {import("../../src/core/types.js").Plugin} plugin
 */
export function assertPluginContract(plugin) {
  assert.ok(plugin && typeof plugin === "object", "plugin must be an object");

  assert.equal(typeof plugin.id, "string", "id must be a string");
  assert.ok(plugin.id.length > 0, "id must be non-empty");

  assert.ok(VALID_KINDS.has(plugin.kind), `kind must be one of ${[...VALID_KINDS].join(", ")}`);

  assert.equal(typeof plugin.label, "string", "label must be a string");
  assert.ok(plugin.label.length > 0, "label must be non-empty");

  if ("description" in plugin) {
    assert.equal(typeof plugin.description, "string", "description must be a string");
  }

  assert.equal(typeof plugin.run, "function", "run must be a function");

  // params is optional, but when present every spec must be fully formed so the
  // schema-driven UI can render it without guessing.
  if ("params" in plugin) {
    assert.ok(Array.isArray(plugin.params), "params must be an array");
    const seen = new Set();
    for (const spec of plugin.params) {
      assertParamSpec(spec);
      assert.ok(!seen.has(spec.name), `duplicate param name: ${spec.name}`);
      seen.add(spec.name);
    }
  }
}

function assertParamSpec(spec) {
  assert.ok(spec && typeof spec === "object", "param spec must be an object");
  assert.equal(typeof spec.name, "string", "param name must be a string");
  assert.ok(spec.name.length > 0, "param name must be non-empty");
  assert.equal(typeof spec.label, "string", `param ${spec.name} label must be a string`);
  assert.ok(VALID_PARAM_TYPES.has(spec.type), `param ${spec.name} has invalid type: ${spec.type}`);
  assert.ok("default" in spec, `param ${spec.name} must declare a default`);

  if (spec.type === "range") {
    assert.equal(typeof spec.min, "number", `range ${spec.name} needs numeric min`);
    assert.equal(typeof spec.max, "number", `range ${spec.name} needs numeric max`);
    assert.ok(spec.max > spec.min, `range ${spec.name} max must exceed min`);
    assert.equal(typeof spec.default, "number", `range ${spec.name} default must be a number`);
    assert.ok(
      spec.default >= spec.min && spec.default <= spec.max,
      `range ${spec.name} default must be within [min, max]`
    );
    if ("step" in spec) {
      assert.equal(typeof spec.step, "number", `range ${spec.name} step must be a number`);
      assert.ok(spec.step > 0, `range ${spec.name} step must be positive`);
    }
  }

  if (spec.type === "boolean") {
    assert.equal(typeof spec.default, "boolean", `boolean ${spec.name} default must be a boolean`);
  }
}
