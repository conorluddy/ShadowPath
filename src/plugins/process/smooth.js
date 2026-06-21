// Process stage: Chaikin corner-cutting smoothing per contour.

import { smoothClosedPath, isMeaningfulContour } from "../../geometry/contour.js";

/** @type {import("../../core/types.js").Plugin} */
export const smooth = {
  id: "smooth",
  kind: "process",
  label: "Smooth",
  description: "Round corners with Chaikin subdivision passes.",
  params: [
    { name: "passes", label: "Smooth", type: "range", min: 0, max: 3, step: 1, default: 1 }
  ],
  run(contours, params) {
    const iterations = Number(params.passes);
    const paths = contours.paths
      .map((path) => smoothClosedPath(path, iterations))
      .filter(isMeaningfulContour);
    return { ...contours, paths };
  }
};
