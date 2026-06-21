// Process stage: blocky steps that keep clean 45-degree edges intact.

import { chamferize } from "../../geometry/grid.js";
import { isMeaningfulContour } from "../../geometry/contour.js";

/** @type {import("../../core/types.js").Plugin} */
export const chamfer = {
  id: "chamfer",
  kind: "process",
  label: "Chamfer 45°",
  description: "Step diagonals onto the grid but keep 45° edges for a bevelled look.",
  params: [
    { name: "cell", label: "Cell size", type: "range", min: 1, max: 32, step: 1, default: 4 },
    { name: "allowDiagonal", label: "Keep 45° edges", type: "boolean", default: true }
  ],
  run(contours, params) {
    const cell = Number(params.cell);
    const allowDiagonal = Boolean(params.allowDiagonal);
    const paths = contours.paths
      .map((path) => chamferize(path, cell, allowDiagonal))
      .filter(isMeaningfulContour);
    return { ...contours, paths };
  }
};
