// Pure grid-quantisation helpers backing the pixel-art process plugins.
//
// A "contour" here is the same shape geometry/contour.js uses: a closed polygon
// of [x, y] points with no repeated closing point. These helpers snap and
// transform those points onto a square grid to produce blocky, stepped, or
// hand-pixelled silhouettes. They are deliberately free of DOM and pipeline
// concerns so each plugin stays a thin wrapper and everything is unit testable.

import { removeCollinear } from "./contour.js";

// Round a single point to the nearest grid intersection. `offset` shifts the
// grid origin so the lattice can be nudged without changing the cell size.
export function snapPoint([x, y], cell, offset = 0) {
  return [
    Math.round((x - offset) / cell) * cell + offset,
    Math.round((y - offset) / cell) * cell + offset
  ];
}

// Snap every point to the grid, drop the consecutive duplicates snapping
// collapses neighbours into, then remove the collinear runs it introduces.
export function snapContour(points, cell, offset = 0) {
  const snapped = points.map((point) => snapPoint(point, cell, offset));
  return removeCollinear(dropConsecutiveDuplicates(snapped));
}

// Replace each diagonal edge with an axis-aligned L (horizontal then vertical),
// so every resulting edge is purely horizontal or vertical — a rectilinear
// staircase silhouette.
export function rectilinearize(points, cell = 1, offset = 0) {
  const snapped = snapContour(points, cell, offset);
  const out = [];
  for (let index = 0; index < snapped.length; index += 1) {
    const start = snapped[index];
    const end = snapped[(index + 1) % snapped.length];
    out.push(start);
    if (start[0] !== end[0] && start[1] !== end[1]) {
      out.push([end[0], start[1]]); // corner: travel horizontally first
    }
  }
  return removeCollinear(out);
}

// Like rectilinearize, but keep clean 45° diagonal edges intact when
// `allowDiagonal` is set — bevelled, isometric-feeling corners. Non-45°
// diagonals still break into axis-aligned steps.
export function chamferize(points, cell = 1, allowDiagonal = true) {
  const snapped = snapContour(points, cell);
  const out = [];
  for (let index = 0; index < snapped.length; index += 1) {
    const start = snapped[index];
    const end = snapped[(index + 1) % snapped.length];
    out.push(start);
    const dx = Math.abs(end[0] - start[0]);
    const dy = Math.abs(end[1] - start[1]);
    const isAxisAligned = dx === 0 || dy === 0;
    const isDiagonal45 = dx === dy && dx !== 0;
    if (!isAxisAligned && !(allowDiagonal && isDiagonal45)) {
      out.push([end[0], start[1]]);
    }
  }
  return removeCollinear(out);
}

// Deterministic pseudo-random displacement in [-1, 1] from integer coordinates
// and a seed. Deliberately not Math.random: the same point always jitters the
// same way, so output is stable and exactly testable.
export function hashJitter(x, y, seed = 0) {
  let hash = Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663) ^ Math.imul(seed | 0, 83492791);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0x5bd1e995);
  hash ^= hash >>> 15;
  return ((hash >>> 0) / 0xffffffff) * 2 - 1;
}

function dropConsecutiveDuplicates(points) {
  const out = [];
  for (const point of points) {
    const previous = out[out.length - 1];
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) {
      out.push(point);
    }
  }
  // The polygon is closed, so a snapped last point can equal the first.
  if (out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      out.pop();
    }
  }
  return out;
}
