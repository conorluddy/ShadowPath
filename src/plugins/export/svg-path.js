// Export stage: serialize all contours into a single SVG <path>. Inner loops
// wind opposite to outer ones, so fill-rule="evenodd" keeps holes transparent.

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

function pathToD(points) {
  const first = points[0];
  const commands = [`M ${roundCoord(first[0])} ${roundCoord(first[1])}`];
  for (let index = 1; index < points.length; index += 1) {
    commands.push(`L ${roundCoord(points[index][0])} ${roundCoord(points[index][1])}`);
  }
  commands.push("Z");
  return commands.join(" ");
}

/** @type {import("../../core/types.js").Plugin} */
export const svgPath = {
  id: "svg-path",
  kind: "export",
  label: "SVG Path",
  description: "Single even-odd path that preserves holes.",
  params: CANVAS_PARAMS,
  run(contours, params) {
    const { paths } = contours;
    const d = paths.map(pathToD).join(" ");
    const text = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxAttr(contours, params)}" role="img">`,
      `  <path d="${d}" fill="#000" fill-rule="evenodd"/>`,
      "</svg>"
    ].join("\n");

    return { kind: "svg", text, mime: "image/svg+xml", filename: "shadowpath.svg" };
  }
};
