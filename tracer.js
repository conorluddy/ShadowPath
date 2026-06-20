(function () {
  "use strict";

  const pointKey = (x, y) => `${x},${y}`;

  function luminance(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function makeMask(imageData, options) {
    const { data, width, height } = imageData;
    const mask = new Uint8Array(width * height);
    const threshold = Number(options.threshold);
    const invert = Boolean(options.invert);
    const transparentBg = Boolean(options.transparentBg);

    for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
      const alpha = data[index + 3];
      if (transparentBg && alpha < 16) {
        mask[pixel] = 0;
        continue;
      }

      const lightness = luminance(data[index], data[index + 1], data[index + 2]);
      mask[pixel] = invert ? lightness >= threshold : lightness <= threshold;
    }

    return mask;
  }

  function traceMask(mask, width, height) {
    const edges = [];
    const starts = new Map();

    function isFilled(x, y) {
      return x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === 1;
    }

    function addEdge(x1, y1, x2, y2) {
      const edge = {
        from: pointKey(x1, y1),
        to: pointKey(x2, y2),
        x1,
        y1,
        x2,
        y2,
        used: false
      };
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

        if (!isFilled(x, y - 1)) {
          addEdge(x, y, x + 1, y);
        }
        if (!isFilled(x + 1, y)) {
          addEdge(x + 1, y, x + 1, y + 1);
        }
        if (!isFilled(x, y + 1)) {
          addEdge(x + 1, y + 1, x, y + 1);
        }
        if (!isFilled(x - 1, y)) {
          addEdge(x, y + 1, x, y);
        }
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
      if (cleaned.length >= 3 && Math.abs(polygonArea(cleaned)) >= 1) {
        paths.push(cleaned);
      }
    }

    return paths;
  }

  function removeCollinear(points) {
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

  function polygonArea(points) {
    let area = 0;
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      area += current[0] * next[1] - next[0] * current[1];
    }
    return area / 2;
  }

  function simplifyClosedPath(points, epsilon) {
    if (epsilon <= 0 || points.length < 4) {
      return points.slice();
    }

    const closed = points.concat([points[0]]);
    const simplified = simplifyOpenPath(closed, epsilon);
    simplified.pop();

    return removeCollinear(simplified);
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

  function smoothClosedPath(points, iterations) {
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

  function processPaths(paths, options) {
    const simplify = Number(options.simplify);
    const smooth = Number(options.smooth);

    return paths
      .map((path) => simplifyClosedPath(path, simplify))
      .map((path) => smoothClosedPath(path, smooth))
      .filter((path) => path.length >= 3 && Math.abs(polygonArea(path)) >= 1);
  }

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

  function buildSvg(paths, width, height) {
    const d = paths.map(pathToD).join(" ");
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img">`,
      `  <path d="${d}" fill="#000" fill-rule="evenodd"/>`,
      "</svg>"
    ].join("\n");
  }

  function traceImageData(imageData, options) {
    const mask = makeMask(imageData, options);
    const rawPaths = traceMask(mask, imageData.width, imageData.height);
    const paths = processPaths(rawPaths, options);
    const pointCount = paths.reduce((sum, path) => sum + path.length, 0);
    const svg = buildSvg(paths, imageData.width, imageData.height);

    return {
      mask,
      paths,
      pointCount,
      rawPathCount: rawPaths.length,
      svg
    };
  }

  function initializeApp() {
    const fileInput = document.querySelector("#fileInput");
    const dropzone = document.querySelector("#dropzone");
    const fileLabel = document.querySelector("#fileLabel");
    const sourceCanvas = document.querySelector("#sourceCanvas");
    const svgPreview = document.querySelector("#svgPreview");
    const svgOutput = document.querySelector("#svgOutput");
    const threshold = document.querySelector("#threshold");
    const thresholdValue = document.querySelector("#thresholdValue");
    const simplify = document.querySelector("#simplify");
    const simplifyValue = document.querySelector("#simplifyValue");
    const smooth = document.querySelector("#smooth");
    const smoothValue = document.querySelector("#smoothValue");
    const invert = document.querySelector("#invert");
    const transparentBg = document.querySelector("#transparentBg");
    const stats = document.querySelector("#stats");
    const copyButton = document.querySelector("#copyButton");
    const downloadButton = document.querySelector("#downloadButton");
    const context = sourceCanvas.getContext("2d", { willReadFrequently: true });

    let imageLoaded = false;
    let latestSvg = "";
    let latestObjectUrl = "";
    let scheduled = false;

    function currentOptions() {
      return {
        threshold: Number(threshold.value),
        simplify: Number(simplify.value),
        smooth: Number(smooth.value),
        invert: invert.checked,
        transparentBg: transparentBg.checked
      };
    }

    function updateControlLabels() {
      thresholdValue.value = threshold.value;
      simplifyValue.value = Number(simplify.value).toFixed(2).replace(/\.00$/, ".0");
      smoothValue.value = smooth.value;
    }

    function clearVector() {
      svgPreview.innerHTML = '<span class="empty-state">SVG preview</span><span class="preview-label">Vector</span>';
      svgOutput.value = "";
      copyButton.disabled = true;
      downloadButton.disabled = true;
      latestSvg = "";
    }

    function scheduleTrace() {
      updateControlLabels();
      if (!imageLoaded || scheduled) {
        return;
      }

      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        traceCurrentImage();
      });
    }

    function traceCurrentImage() {
      const imageData = context.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      const result = traceImageData(imageData, currentOptions());
      latestSvg = result.svg;

      svgPreview.innerHTML = `${latestSvg}<span class="preview-label">Vector</span>`;
      svgOutput.value = latestSvg;
      copyButton.disabled = result.paths.length === 0;
      downloadButton.disabled = result.paths.length === 0;

      stats.innerHTML = [
        `<span>${sourceCanvas.width} x ${sourceCanvas.height}px</span>`,
        `<span>${result.paths.length} path${result.paths.length === 1 ? "" : "s"}</span>`,
        `<span>${result.pointCount.toLocaleString()} vector points</span>`
      ].join("<br>");
    }

    async function loadFile(file) {
      if (!file || !file.type.startsWith("image/")) {
        return;
      }

      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        sourceCanvas.width = image.naturalWidth;
        sourceCanvas.height = image.naturalHeight;
        context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        context.drawImage(image, 0, 0);
        imageLoaded = true;
        fileLabel.textContent = file.name;
        clearVector();
        scheduleTrace();
        URL.revokeObjectURL(objectUrl);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        stats.textContent = "Could not load image";
      };

      image.src = objectUrl;
    }

    fileInput.addEventListener("change", () => {
      loadFile(fileInput.files[0]);
    });

    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragging");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("is-dragging");
    });

    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragging");
      loadFile(event.dataTransfer.files[0]);
    });

    [threshold, simplify, smooth, invert, transparentBg].forEach((control) => {
      control.addEventListener("input", scheduleTrace);
      control.addEventListener("change", scheduleTrace);
    });

    copyButton.addEventListener("click", async () => {
      if (!latestSvg) {
        return;
      }

      try {
        await navigator.clipboard.writeText(latestSvg);
      } catch {
        svgOutput.select();
        document.execCommand("copy");
      }
    });

    downloadButton.addEventListener("click", () => {
      if (!latestSvg) {
        return;
      }

      if (latestObjectUrl) {
        URL.revokeObjectURL(latestObjectUrl);
      }

      const blob = new Blob([latestSvg], { type: "image/svg+xml" });
      latestObjectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = latestObjectUrl;
      link.download = "shadowpath.svg";
      link.click();
    });

    updateControlLabels();
    clearVector();
  }

  const api = {
    makeMask,
    traceMask,
    traceImageData,
    buildSvg,
    processPaths,
    polygonArea
  };

  if (typeof window !== "undefined") {
    window.ShadowPath = api;

    if (typeof document !== "undefined") {
      initializeApp();
    }
  }
})();
