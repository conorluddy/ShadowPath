// Trace stage: walk the boundary edges of filled pixels and stitch them into
// closed contours. Each filled pixel contributes a unit edge only where it
// borders empty space; edges are then followed head-to-tail into loops.

import { pointKey, removeCollinear, isMeaningfulContour } from "../../geometry/contour.js";

/** @type {import("../../core/types.js").Plugin} */
export const edgeTrace = {
  id: "edge-trace",
  kind: "trace",
  label: "Edge Trace",
  description: "Follow filled-pixel borders into closed contours.",
  params: [],
  run(mask) {
    const { data, width, height } = mask;
    const edges = [];
    const starts = new Map();

    const isFilled = (x, y) =>
      x >= 0 && y >= 0 && x < width && y < height && data[y * width + x] === 1;

    function addEdge(x1, y1, x2, y2) {
      const edge = { from: pointKey(x1, y1), to: pointKey(x2, y2), x1, y1, x2, y2, used: false };
      edges.push(edge);
      if (!starts.has(edge.from)) {
        starts.set(edge.from, []);
      }
      starts.get(edge.from).push(edge);
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!isFilled(x, y)) {
          continue;
        }
        if (!isFilled(x, y - 1)) addEdge(x, y, x + 1, y);
        if (!isFilled(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
        if (!isFilled(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
        if (!isFilled(x - 1, y)) addEdge(x, y + 1, x, y);
      }
    }

    const paths = [];

    for (const firstEdge of edges) {
      if (firstEdge.used) {
        continue;
      }

      const start = firstEdge.from;
      let edge = firstEdge;
      const points = [[edge.x1, edge.y1]];

      while (edge && !edge.used) {
        edge.used = true;
        points.push([edge.x2, edge.y2]);
        if (edge.to === start) {
          break;
        }
        const candidates = starts.get(edge.to) || [];
        edge = candidates.find((candidate) => !candidate.used) || null;
      }

      const last = points[points.length - 1];
      if (!edge || pointKey(last[0], last[1]) !== start || points.length < 4) {
        continue;
      }

      points.pop();
      const cleaned = removeCollinear(points);
      if (isMeaningfulContour(cleaned)) {
        paths.push(cleaned);
      }
    }

    return { paths, width, height };
  }
};
