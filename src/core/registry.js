// A tiny plugin registry. Plugins register themselves by kind + id; the pipeline
// and UI look them up by those keys. This is the seam that keeps "core" closed
// for modification but open for extension — adding a feature means registering a
// plugin, never editing the runner.

import { STAGE_KINDS } from "./types.js";

export function createRegistry() {
  /** @type {Map<string, Map<string, import("./types.js").Plugin>>} */
  const byKind = new Map(STAGE_KINDS.map((kind) => [kind, new Map()]));

  function register(plugin) {
    if (!plugin || typeof plugin.run !== "function") {
      throw new Error("A plugin must have a run() function");
    }
    const bucket = byKind.get(plugin.kind);
    if (!bucket) {
      throw new Error(`Unknown plugin kind: ${plugin.kind}`);
    }
    if (bucket.has(plugin.id)) {
      throw new Error(`Duplicate plugin id for kind ${plugin.kind}: ${plugin.id}`);
    }
    bucket.set(plugin.id, plugin);
    return plugin;
  }

  function get(kind, id) {
    const plugin = byKind.get(kind)?.get(id);
    if (!plugin) {
      throw new Error(`No "${kind}" plugin registered with id "${id}"`);
    }
    return plugin;
  }

  function list(kind) {
    return Array.from(byKind.get(kind)?.values() ?? []);
  }

  return { register, get, list };
}
