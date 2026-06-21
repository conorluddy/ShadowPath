import test from "node:test";
import assert from "node:assert/strict";

import {
  PIPELINE_DEFINITION,
  defaultPipelineState,
  resolveConfig
} from "../../src/core/compose.js";
import { DEFAULT_PIPELINE } from "../../src/shadowpath.js";

test("defaultPipelineState selects the first option for single stages", () => {
  const state = defaultPipelineState(PIPELINE_DEFINITION);
  assert.equal(state.mask.selected, "threshold");
  assert.equal(state.trace.selected, "edge-trace");
  assert.equal(state.export.selected, "svg-path");
});

test("defaultPipelineState honours a toggle stage's defaultEnabled whitelist", () => {
  const state = defaultPipelineState(PIPELINE_DEFINITION);
  assert.equal(state.process.enabled.simplify, true);
  assert.equal(state.process.enabled.smooth, true);
  for (const id of ["grid-snap", "staircase", "chamfer", "pixel-jitter"]) {
    assert.equal(state.process.enabled[id], false, `${id} should start off`);
  }
});

test("defaultPipelineState enables every option when no whitelist is given", () => {
  const definition = {
    mask: { mode: "single", options: ["threshold"] },
    trace: { mode: "single", options: ["edge-trace"] },
    process: { mode: "toggle", options: ["a", "b"] },
    export: { mode: "single", options: ["svg-path"] }
  };
  const state = defaultPipelineState(definition);
  assert.deepEqual(state.process.enabled, { a: true, b: true });
});

test("the pixel-art plugins are off by default, so the chain is unchanged", () => {
  const state = defaultPipelineState(PIPELINE_DEFINITION);
  const config = resolveConfig(PIPELINE_DEFINITION, state);
  assert.deepEqual(config.process, [{ id: "simplify" }, { id: "smooth" }]);
});

test("enabling a pixel-art plugin adds it to the chain in declared order", () => {
  const state = defaultPipelineState(PIPELINE_DEFINITION);
  state.process.enabled["grid-snap"] = true;
  const config = resolveConfig(PIPELINE_DEFINITION, state);
  assert.deepEqual(config.process.map((s) => s.id), ["simplify", "smooth", "grid-snap"]);
});

test("the default resolved config matches the canonical default pipeline", () => {
  const state = defaultPipelineState(PIPELINE_DEFINITION);
  assert.deepEqual(resolveConfig(PIPELINE_DEFINITION, state), DEFAULT_PIPELINE);
});

test("disabling a process plugin drops it from the config", () => {
  const state = defaultPipelineState(PIPELINE_DEFINITION);
  state.process.enabled.smooth = false;
  const config = resolveConfig(PIPELINE_DEFINITION, state);
  assert.deepEqual(config.process, [{ id: "simplify" }]);
});

test("disabling every process plugin leaves an empty chain", () => {
  const state = defaultPipelineState(PIPELINE_DEFINITION);
  state.process.enabled.simplify = false;
  state.process.enabled.smooth = false;
  assert.deepEqual(resolveConfig(PIPELINE_DEFINITION, state).process, []);
});

test("the process chain keeps its declared order regardless of toggles", () => {
  const state = defaultPipelineState(PIPELINE_DEFINITION);
  const config = resolveConfig(PIPELINE_DEFINITION, state);
  assert.deepEqual(config.process.map((s) => s.id), ["simplify", "smooth"]);
});

test("selecting a different exporter changes the export stage", () => {
  const state = defaultPipelineState(PIPELINE_DEFINITION);
  state.export.selected = "svg-curve";
  assert.deepEqual(resolveConfig(PIPELINE_DEFINITION, state).export, { id: "svg-curve" });
});

test("both exporters are offered by the definition", () => {
  assert.deepEqual(PIPELINE_DEFINITION.export.options, ["svg-path", "svg-curve"]);
});
