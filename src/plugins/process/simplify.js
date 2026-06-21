// Process stage: Ramer–Douglas–Peucker simplification per contour.

import { simplifyClosedPath, isMeaningfulContour } from "../../geometry/contour.js";

/** @type {import("../../core/types.js").Plugin} */
export const simplify = {
  id: "simplify",
  kind: "process",
  label: "Simplify",
  description: "Remove redundant points within a tolerance.",
  params: [
    { name: "amount", label: "Simplify", type: "range", min: 0, max: 8, step: 0.25, default: 1 }
  ],
  run(contours, params) {
    const epsilon = Number(params.amount);
    const paths = contours.paths
      .map((path) => simplifyClosedPath(path, epsilon))
      .filter(isMeaningfulContour);
    return { ...contours, paths };
  }
};
