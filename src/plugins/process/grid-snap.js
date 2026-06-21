// Process stage: quantise every contour point onto a square grid.

import { snapContour } from "../../geometry/grid.js";
import { isMeaningfulContour } from "../../geometry/contour.js";

/** @type {import("../../core/types.js").Plugin} */
export const gridSnap = {
  id: "grid-snap",
  kind: "process",
  label: "Grid snap",
  description: "Quantise every point to a square grid for a blocky outline.",
  params: [
    { name: "cell", label: "Cell size", type: "range", min: 1, max: 32, step: 1, default: 4 },
    { name: "offset", label: "Grid offset", type: "range", min: 0, max: 16, step: 1, default: 0 }
  ],
  run(contours, params) {
    const cell = Number(params.cell);
    const offset = Number(params.offset);
    const paths = contours.paths
      .map((path) => snapContour(path, cell, offset))
      .filter(isMeaningfulContour);
    return { ...contours, paths };
  }
};
