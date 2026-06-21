// Public entry point. Builds a registry preloaded with the built-in plugins and
// re-exports the pieces the UI (and tests) need. This is the one module a host
// imports to get a working ShadowPath; everything else is internal wiring.

import { createRegistry } from "./core/registry.js";
import { runPipeline, activePlugins, defaultParams } from "./core/pipeline.js";

import { thresholdMask } from "./plugins/mask/threshold.js";
import { edgeTrace } from "./plugins/trace/edge-trace.js";
import { simplify } from "./plugins/process/simplify.js";
import { smooth } from "./plugins/process/smooth.js";
import { svgPath } from "./plugins/export/svg-path.js";
import { svgCurve } from "./plugins/export/svg-curve.js";

import { PIPELINE_DEFINITION, defaultPipelineState, resolveConfig } from "./core/compose.js";

export const builtinPlugins = [thresholdMask, edgeTrace, simplify, smooth, svgPath, svgCurve];

// The default wiring reproduces the original v0.0.1 tracer exactly:
// threshold -> edge trace -> simplify -> smooth -> SVG path.
export const DEFAULT_PIPELINE = {
  mask: { id: "threshold" },
  trace: { id: "edge-trace" },
  process: [{ id: "simplify" }, { id: "smooth" }],
  export: { id: "svg-path" }
};

/** Create a registry with all built-in plugins registered. */
export function createDefaultRegistry() {
  const registry = createRegistry();
  for (const plugin of builtinPlugins) {
    registry.register(plugin);
  }
  return registry;
}

export { runPipeline, activePlugins, defaultParams };
export { PIPELINE_DEFINITION, defaultPipelineState, resolveConfig };
