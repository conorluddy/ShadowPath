# ShadowPath

A dependency-free browser tool for converting simple black-and-white silhouette images into SVG paths.

Open `index.html` in a browser, drop in a PNG/JPEG/WebP/GIF, adjust the threshold and cleanup controls, then copy or download the generated SVG.

## How It Works

1. Draw the image to a canvas.
2. Convert pixels to a binary mask with the threshold slider.
3. Trace the exposed edges of filled pixels into closed contours.
4. Remove collinear points, optionally simplify and smooth the contours.
5. Emit a single SVG path with `fill-rule="evenodd"` so holes remain transparent.

This is aimed at high-contrast silhouettes. Photos and shaded images should be cleaned up first or traced with a much higher simplify value.
