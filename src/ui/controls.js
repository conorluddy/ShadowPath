// Schema-driven control panel.
//
// It renders straight from the pipeline definition and the live state:
//   - "toggle" stages (process) render one group per plugin with an enable
//     checkbox; disabling one greys its params and drops it from the pipeline.
//   - "single" stages render the active plugin's params, plus a selector when
//     more than one plugin is on offer (e.g. choosing the exporter).
// Param controls themselves come from each plugin's declared `params`, so a new
// plugin's knobs appear with no HTML changes.

import { defaultParams } from "../shadowpath.js";
import { formatParamValue } from "./format.js";
import { STAGE_KINDS } from "../core/types.js";

const STAGE_TITLES = { mask: "Mask", trace: "Trace", process: "Process", export: "Export" };

/**
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {ReturnType<import("../core/registry.js").createRegistry>} opts.registry
 * @param {Object} opts.definition Pipeline definition (stage modes + options).
 * @param {Object} opts.state Live pipeline state (mutated in place).
 * @param {Object} opts.values Live per-plugin param values (mutated in place).
 * @param {() => void} opts.onChange Called after any change.
 */
export function renderControls(container, { registry, definition, state, values, onChange }) {
  // Structural changes (toggles, selection) rebuild the panel; param tweaks do
  // not, so dragging a slider never loses focus.
  function update() {
    render();
    onChange();
  }

  function render() {
    container.innerHTML = "";
    for (const kind of STAGE_KINDS) {
      const stage = definition[kind];
      if (stage.mode === "toggle") {
        for (const id of stage.options) {
          container.appendChild(toggleGroup(kind, registry.get(kind, id)));
        }
      } else {
        appendSingleStage(kind, stage);
      }
    }
  }

  function appendSingleStage(kind, stage) {
    const plugin = registry.get(kind, state[kind].selected);
    const hasSelector = stage.options.length > 1;
    const params = plugin.params ?? [];
    if (!hasSelector && params.length === 0) {
      return; // nothing to show (e.g. the parameterless trace stage)
    }

    const group = makeGroup(hasSelector ? STAGE_TITLES[kind] : plugin.label);
    if (hasSelector) {
      group.appendChild(selector(kind, stage));
    }
    appendParams(group, plugin, false);
    container.appendChild(group);
  }

  function toggleGroup(kind, plugin) {
    const enabled = state[kind].enabled[plugin.id] !== false;
    const group = makeGroup(plugin.label);

    const legend = group.querySelector("legend");
    legend.textContent = "";
    const toggle = document.createElement("label");
    toggle.className = "group-toggle";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = enabled;
    const name = document.createElement("span");
    name.textContent = plugin.label;
    toggle.append(box, name);
    legend.appendChild(toggle);

    box.addEventListener("change", () => {
      state[kind].enabled[plugin.id] = box.checked;
      update();
    });

    appendParams(group, plugin, !enabled);
    return group;
  }

  function selector(kind, stage) {
    const wrap = document.createElement("div");
    wrap.className = "control-group";
    const select = document.createElement("select");
    select.className = "plugin-select";
    for (const id of stage.options) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = registry.get(kind, id).label;
      option.selected = id === state[kind].selected;
      select.appendChild(option);
    }
    select.addEventListener("change", () => {
      state[kind].selected = select.value;
      update();
    });
    wrap.appendChild(select);
    return wrap;
  }

  function appendParams(group, plugin, disabled) {
    if (!values[plugin.id]) {
      values[plugin.id] = defaultParams(plugin);
    }
    for (const spec of plugin.params ?? []) {
      const build = builderFor(spec.type);
      group.appendChild(build(plugin.id, spec, disabled));
    }
  }

  function builderFor(type) {
    if (type === "boolean") return buildBoolean;
    if (type === "select") return buildSelect;
    return buildRange;
  }

  function buildSelect(pluginId, spec, disabled) {
    const wrap = document.createElement("div");
    wrap.className = "control-group";

    const id = `ctl-${pluginId}-${spec.name}`;
    const current = values[pluginId][spec.name] ?? spec.default;

    const label = document.createElement("label");
    label.htmlFor = id;
    const text = document.createElement("span");
    text.textContent = spec.label;
    label.appendChild(text);

    const select = document.createElement("select");
    select.className = "plugin-select";
    select.id = id;
    select.disabled = disabled;
    for (const option of spec.options) {
      const el = document.createElement("option");
      el.value = option.value;
      el.textContent = option.label;
      el.selected = option.value === current;
      select.appendChild(el);
    }

    select.addEventListener("change", () => {
      values[pluginId][spec.name] = select.value;
      onChange();
    });

    wrap.append(label, select);
    return wrap;
  }

  function buildRange(pluginId, spec, disabled) {
    const wrap = document.createElement("div");
    wrap.className = "control-group";

    const id = `ctl-${pluginId}-${spec.name}`;
    const current = values[pluginId][spec.name] ?? spec.default;

    const label = document.createElement("label");
    label.htmlFor = id;
    const text = document.createElement("span");
    text.textContent = spec.label;
    const out = document.createElement("output");
    out.htmlFor = id;
    out.value = formatParamValue(spec, current);
    label.append(text, out);

    const input = document.createElement("input");
    input.type = "range";
    input.id = id;
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step ?? 1);
    input.value = String(current);
    input.disabled = disabled;

    input.addEventListener("input", () => {
      const value = Number(input.value);
      values[pluginId][spec.name] = value;
      out.value = formatParamValue(spec, value);
      onChange();
    });

    wrap.append(label, input);
    return wrap;
  }

  function buildBoolean(pluginId, spec, disabled) {
    const wrap = document.createElement("label");
    wrap.className = "toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(values[pluginId][spec.name] ?? spec.default);
    input.disabled = disabled;

    const text = document.createElement("span");
    text.textContent = spec.label;

    input.addEventListener("change", () => {
      values[pluginId][spec.name] = input.checked;
      onChange();
    });

    wrap.append(input, text);
    return wrap;
  }

  render();
}

function makeGroup(label) {
  const group = document.createElement("fieldset");
  group.className = "plugin-group";
  const legend = document.createElement("legend");
  legend.textContent = label;
  group.appendChild(legend);
  return group;
}
