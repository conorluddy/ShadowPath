// Export stage: serialize contours as a single SVG path built from cubic Bézier
// curves (Catmull-Rom through the contour points). Smoother and more compact
// than the straight-line exporter; holes are preserved via fill-rule="evenodd".

import { catmullRomToBezier } from "../../geometry/curve.js";
import { computeViewBox } from "../../geometry/viewport.js";
import { CANVAS_PARAMS } from "./canvas-params.js";

function roundCoord(value) {
  return Number(value.toFixed(2)).toString();
}

function viewBoxAttr(contours, params) {
  const { x, y, width, height } = computeViewBox(contours, {
    mode: params.canvas,
    padding: params.padding
  });
  return [x, y, width, height].map(roundCoord).join(" ");
}

const xy = (point) => `${roundCoord(point[0])} ${roundCoord(point[1])}`;

function contourToD(points, tension) {
  const segments = catmullRomToBezier(points, tension);
  if (segments.length === 0) {
    return "";
  }
  const commands = [`M ${xy(points[0])}`];
  for (const segment of segments) {
    commands.push(`C ${xy(segment.c1)} ${xy(segment.c2)} ${xy(segment.end)}`);
  }
  commands.push("Z");
  return commands.join(" ");
}

/** @type {import("../../core/types.js").Plugin} */
export const svgCurve = {
  id: "svg-curve",
  kind: "export",
  label: "SVG Curves",
  description: "Smooth cubic-Bézier path through the contour points.",
  params: [
    { name: "tension", label: "Tension", type: "range", min: 0, max: 1.5, step: 0.05, default: 1 },
    ...CANVAS_PARAMS
  ],
  run(contours, params) {
    const { paths } = contours;
    const tension = Number(params.tension);
    const d = paths
      .map((path) => contourToD(path, tension))
      .filter((segment) => segment.length > 0)
      .join(" ");

    const text = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxAttr(contours, params)}" role="img">`,
      `  <path d="${d}" fill="#000" fill-rule="evenodd"/>`,
      "</svg>"
    ].join("\n");

    return { kind: "svg", text, mime: "image/svg+xml", filename: "shadowpath.svg" };
  }
};
