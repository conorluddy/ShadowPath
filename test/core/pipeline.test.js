import test from "node:test";
import assert from "node:assert/strict";

import { createRegistry } from "../../src/core/registry.js";
import { runPipeline, activePlugins, defaultParams } from "../../src/core/pipeline.js";

// A registry of trivial plugins lets us assert pipeline mechanics in isolation,
// without depending on the real tracing algorithms.
function harness() {
  const registry = createRegistry();
  const calls = [];

  registry.register({
    id: "mask",
    kind: "mask",
    label: "Mask",
    params: [{ name: "level", type: "range", min: 0, max: 10, default: 5 }],
    run: (image, params) => {
      calls.push(["mask", params.level]);
      return { data: new Uint8Array([1]), width: image.width, height: image.height };
    }
  });
  registry.register({
    id: "trace",
    kind: "trace",
    label: "Trace",
    run: (mask) => ({ paths: [[[0, 0], [1, 0], [1, 1]]], width: mask.width, height: mask.height })
  });
  registry.register({
    id: "tag-a",
    kind: "process",
    label: "A",
    run: (contours) => {
      calls.push(["tag-a"]);
      return { ...contours, paths: contours.paths.map((p) => [...p, [9, 9]]) };
    }
  });
  registry.register({
    id: "tag-b",
    kind: "process",
    label: "B",
    run: (contours) => {
      calls.push(["tag-b"]);
      return contours;
    }
  });
  registry.register({
    id: "export",
    kind: "export",
    label: "Export",
    run: (contours) => ({ kind: "json", text: JSON.stringify(contours.paths), mime: "x", filename: "x" })
  });

  return { registry, calls };
}

const image = { data: new Uint8ClampedArray(4), width: 3, height: 2 };
const config = {
  mask: { id: "mask" },
  trace: { id: "trace" },
  process: [{ id: "tag-a" }, { id: "tag-b" }],
  export: { id: "export" }
};

test("defaultParams reads declared specs", () => {
  const { registry } = harness();
  assert.deepEqual(defaultParams(registry.get("mask", "mask")), { level: 5 });
  assert.deepEqual(defaultParams(registry.get("trace", "trace")), {}, "no params -> empty object");
});

test("activePlugins lists stages in execution order", () => {
  const { registry } = harness();
  assert.deepEqual(
    activePlugins(registry, config).map((p) => p.id),
    ["mask", "trace", "tag-a", "tag-b", "export"]
  );
});

test("runPipeline threads data through every stage and returns artifacts", () => {
  const { registry } = harness();
  const result = runPipeline(image, config, registry);
  assert.ok(result.mask && result.contours && result.output);
  assert.equal(result.contours.width, 3);
  assert.equal(result.contours.height, 2);
});

test("runPipeline applies plugin defaults when no values are given", () => {
  const { registry, calls } = harness();
  runPipeline(image, config, registry);
  assert.deepEqual(calls[0], ["mask", 5]);
});

test("runPipeline lets supplied values override defaults", () => {
  const { registry, calls } = harness();
  runPipeline(image, config, registry, { mask: { level: 9 } });
  assert.deepEqual(calls[0], ["mask", 9]);
});

test("runPipeline runs the process chain in order", () => {
  const { registry, calls } = harness();
  runPipeline(image, config, registry);
  assert.deepEqual(
    calls.filter((c) => c[0].startsWith("tag")),
    [["tag-a"], ["tag-b"]]
  );
});

test("runPipeline supports an empty process chain", () => {
  const { registry } = harness();
  const bare = { ...config, process: [] };
  const result = runPipeline(image, bare, registry);
  assert.equal(result.pointCount, 3, "untouched triangle has three points");
});

test("runPipeline sums point counts across all contours", () => {
  const { registry } = harness();
  // tag-a appends one point, so the triangle becomes four points.
  const result = runPipeline(image, config, registry);
  assert.equal(result.pointCount, 4);
});

test("runPipeline throws when a configured plugin is missing", () => {
  const { registry } = harness();
  const broken = { ...config, export: { id: "missing" } };
  assert.throws(() => runPipeline(image, broken, registry), /No "export" plugin/);
});
