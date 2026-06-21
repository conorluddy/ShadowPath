// App wiring: image loading, canvas, preview, copy/download, and stats. All of
// the actual tracing work is delegated to the pipeline, so this file only knows
// about the DOM and the IR — never the algorithms.

import {
  createDefaultRegistry,
  runPipeline,
  activePlugins,
  DEFAULT_PIPELINE
} from "../shadowpath.js";
import { renderControls } from "./controls.js";

function initializeApp() {
  const registry = createDefaultRegistry();
  const config = DEFAULT_PIPELINE;

  const fileInput = document.querySelector("#fileInput");
  const dropzone = document.querySelector("#dropzone");
  const fileLabel = document.querySelector("#fileLabel");
  const sourceCanvas = document.querySelector("#sourceCanvas");
  const svgPreview = document.querySelector("#svgPreview");
  const svgOutput = document.querySelector("#svgOutput");
  const controlsHost = document.querySelector("#pluginControls");
  const stats = document.querySelector("#stats");
  const copyButton = document.querySelector("#copyButton");
  const downloadButton = document.querySelector("#downloadButton");
  const context = sourceCanvas.getContext("2d", { willReadFrequently: true });

  let imageLoaded = false;
  let latestText = "";
  let latestObjectUrl = "";
  let scheduled = false;

  // Generate the control panel from the active plugins' param schemas.
  const { values } = renderControls(controlsHost, activePlugins(registry, config), scheduleTrace);

  function clearVector() {
    svgPreview.innerHTML =
      '<span class="empty-state">SVG preview</span><span class="preview-label">Vector</span>';
    svgOutput.value = "";
    copyButton.disabled = true;
    downloadButton.disabled = true;
    latestText = "";
  }

  function scheduleTrace() {
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
    const { output, contours, pointCount } = runPipeline(imageData, config, registry, values);
    latestText = output.text;

    svgPreview.innerHTML = `${output.text}<span class="preview-label">Vector</span>`;
    svgOutput.value = output.text;
    const hasPaths = contours.paths.length > 0;
    copyButton.disabled = !hasPaths;
    downloadButton.disabled = !hasPaths;

    stats.innerHTML = [
      `<span>${sourceCanvas.width} x ${sourceCanvas.height}px</span>`,
      `<span>${contours.paths.length} path${contours.paths.length === 1 ? "" : "s"}</span>`,
      `<span>${pointCount.toLocaleString()} vector points</span>`
    ].join("<br>");
  }

  function loadFile(file) {
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

  fileInput.addEventListener("change", () => loadFile(fileInput.files[0]));

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

  copyButton.addEventListener("click", async () => {
    if (!latestText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(latestText);
    } catch {
      svgOutput.select();
      document.execCommand("copy");
    }
  });

  downloadButton.addEventListener("click", () => {
    if (!latestText) {
      return;
    }
    if (latestObjectUrl) {
      URL.revokeObjectURL(latestObjectUrl);
    }
    const blob = new Blob([latestText], { type: "image/svg+xml" });
    latestObjectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = latestObjectUrl;
    link.download = "shadowpath.svg";
    link.click();
  });

  clearVector();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
