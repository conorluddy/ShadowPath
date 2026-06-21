// Pure contour geometry helpers.
//
// A "contour" is a closed polygon represented as an array of [x, y] points,
// with no repeated closing point. These helpers are deliberately free of any
// DOM or pipeline concerns so they can be unit tested and reused by plugins.

export const pointKey = (x, y) => `${x},${y}`;

// Signed area via the shoelace formula. Sign encodes winding direction, which
// is what lets the SVG exporter rely on fill-rule="evenodd" to keep holes open.
export function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

// Drop points that sit on a straight run between their neighbours.
export function removeCollinear(points) {
  if (points.length < 4) {
    return points.slice();
  }

  const cleaned = [];

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const ax = current[0] - previous[0];
    const ay = current[1] - previous[1];
    const bx = next[0] - current[0];
    const by = next[1] - current[1];

    if (ax * by - ay * bx !== 0) {
      cleaned.push(current);
    }
  }

  return cleaned;
}

function pointToSegmentDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];

  if (dx === 0 && dy === 0) {
    return Math.hypot(point[0] - start[0], point[1] - start[1]);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)
    )
  );
  const projectionX = start[0] + t * dx;
  const projectionY = start[1] + t * dy;

  return Math.hypot(point[0] - projectionX, point[1] - projectionY);
}

function simplifyOpenPath(points, epsilon) {
  if (points.length <= 2) {
    return points.slice();
  }

  let maxDistance = 0;
  let splitIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = pointToSegmentDistance(points[index], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      splitIndex = index;
    }
  }

  if (maxDistance <= epsilon) {
    return [start, end];
  }

  const left = simplifyOpenPath(points.slice(0, splitIndex + 1), epsilon);
  const right = simplifyOpenPath(points.slice(splitIndex), epsilon);

  return left.slice(0, -1).concat(right);
}

// Ramer–Douglas–Peucker simplification applied to a closed contour.
export function simplifyClosedPath(points, epsilon) {
  if (epsilon <= 0 || points.length < 4) {
    return points.slice();
  }

  const closed = points.concat([points[0]]);
  const simplified = simplifyOpenPath(closed, epsilon);
  simplified.pop();

  return removeCollinear(simplified);
}

// Chaikin-style corner cutting. Each pass roughly doubles the point count, so
// it is capped to avoid runaway growth on large contours.
export function smoothClosedPath(points, iterations) {
  let result = points.slice();

  for (let pass = 0; pass < iterations; pass += 1) {
    if (result.length < 3 || result.length > 12000) {
      break;
    }

    const next = [];
    for (let index = 0; index < result.length; index += 1) {
      const current = result[index];
      const following = result[(index + 1) % result.length];
      next.push([
        current[0] * 0.75 + following[0] * 0.25,
        current[1] * 0.75 + following[1] * 0.25
      ]);
      next.push([
        current[0] * 0.25 + following[0] * 0.75,
        current[1] * 0.25 + following[1] * 0.75
      ]);
    }
    result = next;
  }

  return result;
}

// Shared gate for discarding degenerate contours.
export function isMeaningfulContour(points) {
  return points.length >= 3 && Math.abs(polygonArea(points)) >= 1;
}
