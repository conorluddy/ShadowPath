// Shared "output canvas" param specs for the SVG exporters. Both exporters frame
// their viewBox identically, so they declare the same controls from one source —
// the only sanctioned reason to share here is that the viewBox math behind these
// params (see geometry/viewport.js) must stay byte-for-byte in sync.

/** @type {import("../../core/types.js").ParamSpec[]} */
export const CANVAS_PARAMS = [
  {
    name: "canvas",
    label: "Canvas",
    type: "select",
    default: "full",
    options: [
      { value: "full", label: "Full image" },
      { value: "crop", label: "Crop to shape" },
      { value: "1:1", label: "Square (1:1)" },
      { value: "16:9", label: "Widescreen (16:9)" },
      { value: "4:3", label: "Standard (4:3)" },
      { value: "9:16", label: "Portrait (9:16)" },
      { value: "3:2", label: "Photo (3:2)" }
    ]
  },
  { name: "padding", label: "Padding (px)", type: "range", min: 0, max: 100, step: 1, default: 0 }
];
