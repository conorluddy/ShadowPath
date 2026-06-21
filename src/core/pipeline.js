// The pipeline runner. It walks a config describing which plugin fills each
// stage (and, for the process stage, an ordered chain), threading the IR from
// one to the next. It returns every intermediate artifact so the UI can drive
// previews and stats without re-running anything.

/**
 * @typedef {Object} PipelineConfig
 * @property {{ id: string }} mask
 * @property {{ id: string }} trace
 * @property {{ id: string }[]} process Ordered chain of process plugins.
 * @property {{ id: string }} export
 */

/**
 * Resolve the active plugins for a config, in execution order. Useful for the
 * UI, which renders controls from exactly this list.
 */
export function activePlugins(registry, config) {
  return [
    registry.get("mask", config.mask.id),
    registry.get("trace", config.trace.id),
    ...config.process.map((step) => registry.get("process", step.id)),
    registry.get("export", config.export.id)
  ];
}

/**
 * Run the full pipeline.
 *
 * @param {import("./types.js").SourceImage} imageData
 * @param {PipelineConfig} config
 * @param {ReturnType<import("./registry.js").createRegistry>} registry
 * @param {Object} [values] Per-plugin param values keyed by plugin id.
 */
export function runPipeline(imageData, config, registry, values = {}) {
  const ctx = { width: imageData.width, height: imageData.height };
  const paramsFor = (plugin) => ({ ...defaultParams(plugin), ...(values[plugin.id] ?? {}) });

  const maskPlugin = registry.get("mask", config.mask.id);
  const mask = maskPlugin.run(imageData, paramsFor(maskPlugin), ctx);

  const tracePlugin = registry.get("trace", config.trace.id);
  let contours = tracePlugin.run(mask, paramsFor(tracePlugin), ctx);

  for (const step of config.process) {
    const plugin = registry.get("process", step.id);
    contours = plugin.run(contours, paramsFor(plugin), ctx);
  }

  const exportPlugin = registry.get("export", config.export.id);
  const output = exportPlugin.run(contours, paramsFor(exportPlugin), ctx);

  const pointCount = contours.paths.reduce((sum, path) => sum + path.length, 0);

  return { mask, contours, output, pointCount };
}

/** Build a defaults object from a plugin's declared param specs. */
export function defaultParams(plugin) {
  const params = {};
  for (const spec of plugin.params ?? []) {
    params[spec.name] = spec.default;
  }
  return params;
}
