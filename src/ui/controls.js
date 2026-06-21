// Schema-driven control panel. Given the active plugins (in pipeline order), it
// renders one group per plugin and a control per declared param. Because the
// markup is generated from each plugin's `params`, a new plugin's knobs appear
// automatically — no HTML edits required.

import { defaultParams } from "../shadowpath.js";

/**
 * @param {HTMLElement} container
 * @param {import("../core/types.js").Plugin[]} plugins
 * @param {() => void} onChange Called after any value changes.
 * @returns {{ values: Object }} Live, mutable values keyed by plugin id.
 */
export function renderControls(container, plugins, onChange) {
  const values = {};
  container.innerHTML = "";

  for (const plugin of plugins) {
    if (!plugin.params || plugin.params.length === 0) {
      continue;
    }

    values[plugin.id] = defaultParams(plugin);

    const group = document.createElement("fieldset");
    group.className = "plugin-group";
    const legend = document.createElement("legend");
    legend.textContent = plugin.label;
    group.appendChild(legend);

    for (const spec of plugin.params) {
      group.appendChild(buildControl(plugin.id, spec, values, onChange));
    }

    container.appendChild(group);
  }

  return { values };
}

function buildControl(pluginId, spec, values, onChange) {
  return spec.type === "boolean"
    ? buildBoolean(pluginId, spec, values, onChange)
    : buildRange(pluginId, spec, values, onChange);
}

function buildRange(pluginId, spec, values, onChange) {
  const wrap = document.createElement("div");
  wrap.className = "control-group";

  const label = document.createElement("label");
  const id = `ctl-${pluginId}-${spec.name}`;
  label.htmlFor = id;

  const text = document.createElement("span");
  text.textContent = spec.label;
  const out = document.createElement("output");
  out.htmlFor = id;
  out.value = formatValue(spec, spec.default);
  label.append(text, out);

  const input = document.createElement("input");
  input.type = "range";
  input.id = id;
  input.min = String(spec.min);
  input.max = String(spec.max);
  input.step = String(spec.step ?? 1);
  input.value = String(spec.default);

  input.addEventListener("input", () => {
    const value = Number(input.value);
    values[pluginId][spec.name] = value;
    out.value = formatValue(spec, value);
    onChange();
  });

  wrap.append(label, input);
  return wrap;
}

function buildBoolean(pluginId, spec, values, onChange) {
  const wrap = document.createElement("label");
  wrap.className = "toggle";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(spec.default);

  const text = document.createElement("span");
  text.textContent = spec.label;

  input.addEventListener("change", () => {
    values[pluginId][spec.name] = input.checked;
    onChange();
  });

  wrap.append(input, text);
  return wrap;
}

function formatValue(spec, value) {
  const step = spec.step ?? 1;
  if (!Number.isInteger(step)) {
    return Number(value).toFixed(2).replace(/\.00$/, ".0");
  }
  return String(value);
}
