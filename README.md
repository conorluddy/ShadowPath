# ShadowPath

ShadowPath is a tiny browser tool for turning simple black-and-white silhouette images into SVG paths.

It runs entirely in the browser: drop in an image, adjust the trace controls, then copy or download the generated SVG.

## Features

- Converts PNG, JPEG, WebP, and GIF images into SVG markup.
- Works best with clean black-and-white silhouettes.
- Includes threshold, simplify, smoothing, and invert controls.
- Keeps holes and cutouts transparent with SVG `fill-rule="evenodd"`.
- Has no build step, backend, or runtime dependencies.

## Use It

Open `index.html` in any modern browser.

For GitHub Pages, publish the repo from the `main` branch root and visit:

```text
https://conorluddy.github.io/shadowpath/
```

## Local Development

No install is required. The app is plain HTML, CSS, and JavaScript.

```text
index.html
styles.css
tracer.js
```

## How It Works

1. Draw the image to a canvas.
2. Convert pixels to a binary mask with the threshold slider.
3. Trace the exposed edges of filled pixels into closed contours.
4. Remove collinear points, optionally simplify and smooth the contours.
5. Emit a single SVG path with `fill-rule="evenodd"` so holes remain transparent.

## Notes

ShadowPath is designed for high-contrast silhouettes, logos, icons, and cutout-style images. Photos and shaded images should be cleaned up first for best results.
