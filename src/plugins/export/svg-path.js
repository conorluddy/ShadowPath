// Export stage: serialize all contours into a single SVG <path>. Inner loops
// wind opposite to outer ones, so fill-rule="evenodd" keeps holes transparent.

function roundCoord(value) {
  return Number(value.toFixed(2)).toString();
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
  params: [],
  run(contours) {
    const { paths, width, height } = contours;
    const d = paths.map(pathToD).join(" ");
    const text = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img">`,
      `  <path d="${d}" fill="#000" fill-rule="evenodd"/>`,
      "</svg>"
    ].join("\n");

    return { kind: "svg", text, mime: "image/svg+xml", filename: "shadowpath.svg" };
  }
};
