// Process stage: snap to a grid then nudge each point deterministically for a
// hand-pixelled, dithered edge.

import { snapContour, hashJitter } from "../../geometry/grid.js";
import { isMeaningfulContour } from "../../geometry/contour.js";

/** @type {import("../../core/types.js").Plugin} */
export const pixelJitter = {
  id: "pixel-jitter",
  kind: "process",
  label: "Edge jitter",
  description: "Snap to a grid, then deterministically jitter each point.",
  params: [
    { name: "cell", label: "Cell size", type: "range", min: 1, max: 32, step: 1, default: 4 },
    { name: "amount", label: "Jitter", type: "range", min: 0, max: 4, step: 0.25, default: 1 },
    { name: "seed", label: "Seed", type: "range", min: 0, max: 99, step: 1, default: 0 }
  ],
  run(contours, params) {
    const cell = Number(params.cell);
    const amount = Number(params.amount);
    const seed = Number(params.seed);
    const paths = contours.paths
      .map((path) =>
        snapContour(path, cell).map(([x, y]) => [
          x + hashJitter(x, y, seed) * amount,
          y + hashJitter(y, x, seed + 1) * amount
        ])
      )
      .filter(isMeaningfulContour);
    return { ...contours, paths };
  }
};
