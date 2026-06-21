// Pipeline composition: turn a declarative pipeline definition plus user choices
// into a runtime config for the pipeline runner. Kept pure (no DOM) so the
// toggle/select behaviour can be unit tested directly; the control panel is just
// a thin renderer over this state.
//
// Stage modes:
//   "single" — exactly one plugin is active (a selection).
//   "toggle" — any subset is active, each independently on/off, in declared order.

import { STAGE_KINDS } from "./types.js";

/**
 * The default wiring. The required spine (mask, trace) and the chosen exporter
 * are single-select; the process plugins are independently toggleable.
 */
export const PIPELINE_DEFINITION = {
  mask: { mode: "single", options: ["threshold"] },
  trace: { mode: "single", options: ["edge-trace"] },
  process: { mode: "toggle", options: ["simplify", "smooth"] },
  export: { mode: "single", options: ["svg-path", "svg-curve"] }
};

/** Build the initial UI state: first option selected, all toggles on. */
export function defaultPipelineState(definition) {
  const state = {};
  for (const kind of STAGE_KINDS) {
    const stage = definition[kind];
    if (stage.mode === "toggle") {
      state[kind] = { enabled: Object.fromEntries(stage.options.map((id) => [id, true])) };
    } else {
      state[kind] = { selected: stage.options[0] };
    }
  }
  return state;
}

/** Derive the runtime pipeline config consumed by runPipeline. */
export function resolveConfig(definition, state) {
  const config = {};
  for (const kind of STAGE_KINDS) {
    const stage = definition[kind];
    if (stage.mode === "toggle") {
      config[kind] = stage.options
        .filter((id) => state[kind]?.enabled?.[id] !== false)
        .map((id) => ({ id }));
    } else {
      config[kind] = { id: state[kind]?.selected ?? stage.options[0] };
    }
  }
  return config;
}
