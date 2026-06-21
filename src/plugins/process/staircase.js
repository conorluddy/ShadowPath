// Process stage: replace diagonal edges with axis-aligned steps.

import { rectilinearize } from "../../geometry/grid.js";
import { isMeaningfulContour } from "../../geometry/contour.js";

/** @type {import("../../core/types.js").Plugin} */
export const staircase = {
  id: "staircase",
  kind: "process",
  label: "Rectilinear",
  description: "Turn every diagonal edge into horizontal and vertical steps.",
  params: [
    { name: "cell", label: "Step size", type: "range", min: 1, max: 32, step: 1, default: 4 }
  ],
  run(contours, params) {
    const cell = Number(params.cell);
    const paths = contours.paths
      .map((path) => rectilinearize(path, cell))
      .filter(isMeaningfulContour);
    return { ...contours, paths };
  }
};
