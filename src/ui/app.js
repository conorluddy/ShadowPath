// App wiring: image loading, canvas, preview, copy/download, and stats. All of
// the actual tracing work is delegated to the pipeline, so this file only knows
// about the DOM and the IR — never the algorithms.

import {
  createDefaultRegistry,
  runPipeline,
  PIPELINE_DEFINITION,
  defaultPipelineState,
  resolveConfig
} from "../shadowpath.js";
import { renderControls } from "./controls.js";

function initializeApp() {
  const registry = createDefaultRegistry();
  const definition = PIPELINE_DEFINITION;
  const state = defaultPipelineState(definition);
  const values = {};

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

  // Tabbed preview: one stage, four views switched via a data-view attribute.
  const previewStage = document.querySelector("#previewStage");
  const viewTabs = document.querySelectorAll(".view-tab");
  const vectorSolo = document.querySelector("#vectorSolo");
  const overlayControl = document.querySelector("#overlayControl");
  const overlayRange = document.querySelector("#overlayRange");
  const overlayValue = document.querySelector("#overlayValue");
  const overlayCanvas = document.querySelector("#overlayCanvas");
  const overlayContext = overlayCanvas.getContext("2d");
  const overlayVector = document.querySelector("#overlayVector");
  const scaleRange = document.querySelector("#scaleRange");
  const scaleValue = document.querySelector("#scaleValue");
  const backgroundColor = document.querySelector("#backgroundColor");
  const backgroundValue = document.querySelector("#backgroundValue");
  const backgroundPresets = document.querySelectorAll("[data-background]");
  const foregroundColor = document.querySelector("#foregroundColor");
  const exportForeground = document.querySelector("#exportForeground");
  let traceOutput = null;
  let latestOutput = null;

  function applyForegroundColor() {
    if (!traceOutput) return;
    const template = document.createElement("template");
    template.innerHTML = traceOutput.text;
    for (const path of template.content.querySelectorAll("svg path")) {
      path.setAttribute("fill", foregroundColor.value);
    }
    const previewText = template.innerHTML;
    latestOutput = exportForeground.checked ? { ...traceOutput, text: previewText } : traceOutput;
    svgPreview.innerHTML = `<span class="preview-label accent">Vector <em>SVG</em></span>${previewText}`;
    vectorSolo.innerHTML = previewText;
    overlayVector.innerHTML = previewText;
    svgOutput.value = latestOutput.text;
  }

  foregroundColor.addEventListener("change", applyForegroundColor);
  exportForeground.addEventListener("change", applyForegroundColor);

  // Keep the background on the preview container, outside the pipeline and SVG.
  function applyBackgroundColor() {
    const color = backgroundColor.value;
    previewStage.style.setProperty("--preview-background", color);
    backgroundValue.value = color;
    for (const preset of backgroundPresets) {
      preset.setAttribute("aria-pressed", String(preset.dataset.background === color));
    }
    if (color !== "#808080") {
      // Choose black or white for contrast, including custom background colours.
      const channels = color.slice(1).match(/../g).map((hex) => {
        const channel = parseInt(hex, 16) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      foregroundColor.value = luminance > 0.179 ? "#000000" : "#ffffff";
    }
    applyForegroundColor();
  }

  backgroundColor.addEventListener("input", applyBackgroundColor);
  for (const preset of backgroundPresets) {
    preset.addEventListener("click", () => {
      backgroundColor.value = preset.dataset.background;
      applyBackgroundColor();
    });
  }
  applyBackgroundColor();

  function selectView(view) {
    previewStage.dataset.view = view;
    overlayControl.hidden = view !== "overlay";
    for (const tab of viewTabs) {
      const active = tab.dataset.view === view;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    }
  }

  for (const tab of viewTabs) {
    tab.addEventListener("click", () => selectView(tab.dataset.view));
  }

  overlayRange.addEventListener("input", () => {
    overlayCanvas.style.opacity = String(Number(overlayRange.value) / 100);
    overlayValue.textContent = `${overlayRange.value}%`;
  });
  overlayCanvas.style.opacity = String(Number(overlayRange.value) / 100);

  // Output-scale: previews the traced SVG at smaller sizes across every view.
  // The factor lives on the preview stage (an ancestor of all output SVGs), so a
  // single variable scales them all and it survives each trace re-render.
  function applyOutputScale() {
    previewStage.style.setProperty("--output-scale", String(Number(scaleRange.value) / 100));
    scaleValue.textContent = `${scaleRange.value}%`;
  }
  scaleRange.addEventListener("input", applyOutputScale);
  applyOutputScale();

  // Overlay alignment: drag the output SVG to register it against the source
  // canvas beneath. The offset is applied as a translate on #overlayVector;
  // double-click resets it. Offset is in CSS pixels of the preview, reset on
  // each new image.
  let overlayOffsetX = 0;
  let overlayOffsetY = 0;
  let overlayDragStart = null;

  function applyOverlayOffset() {
    overlayVector.style.setProperty("--overlay-x", `${overlayOffsetX}px`);
    overlayVector.style.setProperty("--overlay-y", `${overlayOffsetY}px`);
  }

  function resetOverlayOffset() {
    overlayOffsetX = 0;
    overlayOffsetY = 0;
    applyOverlayOffset();
  }

  overlayVector.addEventListener("pointerdown", (event) => {
    overlayDragStart = { x: event.clientX, y: event.clientY, offsetX: overlayOffsetX, offsetY: overlayOffsetY };
    overlayVector.classList.add("dragging");
    overlayVector.setPointerCapture(event.pointerId);
  });

  overlayVector.addEventListener("pointermove", (event) => {
    if (!overlayDragStart) {
      return;
    }
    overlayOffsetX = overlayDragStart.offsetX + (event.clientX - overlayDragStart.x);
    overlayOffsetY = overlayDragStart.offsetY + (event.clientY - overlayDragStart.y);
    applyOverlayOffset();
  });

  function endOverlayDrag(event) {
    if (!overlayDragStart) {
      return;
    }
    overlayDragStart = null;
    overlayVector.classList.remove("dragging");
    overlayVector.releasePointerCapture(event.pointerId);
  }
  overlayVector.addEventListener("pointerup", endOverlayDrag);
  overlayVector.addEventListener("pointercancel", endOverlayDrag);
  overlayVector.addEventListener("dblclick", resetOverlayOffset);

  let imageLoaded = false;
  let latestObjectUrl = "";
  let scheduled = false;

  // Generate the control panel from the pipeline definition and live state.
  renderControls(controlsHost, { registry, definition, state, values, onChange: scheduleTrace });

  function clearVector() {
    svgPreview.innerHTML =
      '<span class="preview-label accent">Vector <em>SVG</em></span>' +
      '<span class="empty-state">SVG preview</span>';
    vectorSolo.innerHTML = "";
    overlayVector.innerHTML = "";
    overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    svgOutput.value = "";
    copyButton.disabled = true;
    downloadButton.disabled = true;
    traceOutput = null;
    latestOutput = null;
    resetOverlayOffset();
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
    const config = resolveConfig(definition, state);
    const { output, contours, pointCount } = runPipeline(imageData, config, registry, values);
    traceOutput = output;

    // Colour every preview; the export checkbox controls the code, copy and download.
    applyForegroundColor();
    overlayCanvas.width = sourceCanvas.width;
    overlayCanvas.height = sourceCanvas.height;
    overlayContext.drawImage(sourceCanvas, 0, 0);
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
    if (!latestOutput) {
      return;
    }
    try {
      await navigator.clipboard.writeText(latestOutput.text);
    } catch {
      svgOutput.select();
      document.execCommand("copy");
    }
  });

  downloadButton.addEventListener("click", () => {
    if (!latestOutput) {
      return;
    }
    if (latestObjectUrl) {
      URL.revokeObjectURL(latestObjectUrl);
    }
    const blob = new Blob([latestOutput.text], { type: latestOutput.mime });
    latestObjectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = latestObjectUrl;
    link.download = latestOutput.filename;
    link.click();
  });

  clearVector();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
