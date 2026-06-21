// Pipeline composition: turn a declarative pipeline definition plus user choices
// into a runtime config for the pipeline runner. Kept pure (no DOM) so the
// toggle/select behaviour can be unit tested directly; the control panel is just
// a thin renderer over this state.
//
// Stage modes:
//   "single" — exactly one plugin is active (a selection).
//   "toggle" — any subset is active, each independently on/off. The state owns
//              the order (so the UI can drag-and-drop reorder them); it seeds
//              from the declared option order. An optional `defaultEnabled`
//              whitelist sets which start on; omit it to start every option on.

import { STAGE_KINDS } from "./types.js";

/**
 * The default wiring. The required spine (mask, trace) and the chosen exporter
 * are single-select; the process plugins are independently toggleable.
 */
export const PIPELINE_DEFINITION = {
  mask: { mode: "single", options: ["threshold"] },
  trace: { mode: "single", options: ["edge-trace"] },
  process: {
    mode: "toggle",
    options: ["simplify", "smooth", "grid-snap", "staircase", "chamfer", "pixel-jitter"],
    // The pixel-art plugins start off so the default trace is unchanged.
    defaultEnabled: ["simplify", "smooth"]
  },
  export: { mode: "single", options: ["svg-path", "svg-curve"] }
};

/** Build the initial UI state: first option selected, all toggles on. */
export function defaultPipelineState(definition) {
  const state = {};
  for (const kind of STAGE_KINDS) {
    const stage = definition[kind];
    if (stage.mode === "toggle") {
      const startsOn = (id) => !stage.defaultEnabled || stage.defaultEnabled.includes(id);
      state[kind] = {
        enabled: Object.fromEntries(stage.options.map((id) => [id, startsOn(id)])),
        order: [...stage.options]
      };
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
      // Order comes from the user-controlled state (drag-and-drop); fall back to
      // the declared option order before any state exists.
      const order = state[kind]?.order ?? stage.options;
      config[kind] = order
        .filter((id) => state[kind]?.enabled?.[id] !== false)
        .map((id) => ({ id }));
    } else {
      config[kind] = { id: state[kind]?.selected ?? stage.options[0] };
    }
  }
  return config;
}
