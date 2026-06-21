// Pure curve math. Converts a closed contour into a sequence of cubic Bézier
// segments using a Catmull-Rom (cardinal) spline: the curve passes through every
// input point, while a tension parameter controls how much it bows between them.
//
// Each returned segment carries the two control points and the end point; the
// implied start of segment i is the contour's i-th point (and the start of the
// whole path is points[0]).

/**
 * @param {[number, number][]} points A closed contour (no repeated end point).
 * @param {number} tension 0 = straight segments, 1 = standard Catmull-Rom.
 * @returns {{ c1: [number, number], c2: [number, number], end: [number, number] }[]}
 */
export function catmullRomToBezier(points, tension) {
  const n = points.length;
  if (n < 3) {
    return [];
  }

  const k = tension / 6;
  const segments = [];

  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    segments.push({
      c1: [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k],
      c2: [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k],
      end: [p2[0], p2[1]]
    });
  }

  return segments;
}
