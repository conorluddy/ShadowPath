
# ShadowPath

ShadowPath is a tiny browser tool for turning simple black-and-white silhouette images into SVG paths.

It runs entirely in the browser: drop in an image, adjust the trace controls, then copy or download the generated SVG.

<img width="1512" height="830" alt="Screenshot 2026-06-20 at 20 16 24" src="https://github.com/user-attachments/assets/7010b964-3604-4f66-bfa4-fe480ddbe7bc" />

## Features

- Converts PNG, JPEG, WebP, and GIF images into SVG markup.
- Works best with clean black-and-white silhouettes.
- Includes threshold, simplify, smoothing, and invert controls.
- Exports straight-line or smooth cubic-Bézier SVG paths.
- Lets you toggle individual processing steps on and off.
- Keeps holes and cutouts transparent with SVG `fill-rule="evenodd"`.
- Has no build step, backend, or runtime dependencies.

## Use It

The app is built from native ES modules, so serve it over HTTP rather than
opening the file directly (browsers block module imports on `file://`).

```text
npx serve .
```

For GitHub Pages, publish the repo from the `main` branch root and visit:

```text
https://conorluddy.github.io/ShadowPath/
```

## Local Development

No build step and no runtime dependencies. The app is plain HTML, CSS, and
JavaScript ES modules.

```text
index.html
styles.css
src/
  core/        pipeline runner, plugin registry, IR type contract
  geometry/    pure contour math
  plugins/     each tracing stage as a plugin (mask / trace / process / export)
  ui/          schema-driven controls and app wiring
  shadowpath.js  entry: registers built-ins, exposes the public API
test/          Node behavior tests
```

Testing is a first-class concern: every module and plugin is tested
independently with no test dependencies. Run the specs with Node:

```text
npm test            # run once
npm run test:watch  # TDD loop
npm run test:coverage
```

See [TESTING.md](TESTING.md) for the spec-driven workflow and how to add a
plugin test-first.

## Architecture

ShadowPath is a small **pipeline of plugins**. Each stage transforms one shape
of the shared data contract (the "IR") into the next:

```text
ImageData  ->  Mask  ->  Contours  ->  Contours  ->  SVG
            mask       trace        process[]      export
```

Plugins register themselves with the registry and declare their own parameters,
which the control panel renders automatically — adding a feature means writing a
plugin, not editing the core or the HTML. Implementations can later be swapped
(for example a WASM-backed plugin) behind the same stage interface.

Each stage is either single-select (pick the active plugin, e.g. the exporter)
or a toggle stage where each plugin can be turned on or off independently (the
processing steps). `src/core/compose.js` turns those choices into a runtime
config; the control panel is a thin renderer over that state.

## Contributing

A few principles keep ShadowPath easy to grow. See [CLAUDE.md](CLAUDE.md) for the
full working guide and [TESTING.md](TESTING.md) for the testing workflow.

- **Stay static, no build, zero dependencies.** No backend, no bundler, no npm
  runtime or test dependencies.
- **A new feature is a new plugin.** Write a plugin and register it in
  `src/shadowpath.js`; do not edit the pipeline core or `index.html` to add one.
- **Plugins are pure and speak only the IR.** Shared math lives in
  `src/geometry/`; keep DOM logic in `src/ui/` and pure logic in its own module.
- **Declare params, never hardcode controls.** The control panel renders from
  each plugin's param specs.
- **Test first.** Every module and plugin is tested independently with edge-case
  coverage; new plugins start from the plugin contract.

## How It Works

1. Draw the image to a canvas.
2. **Mask** — convert pixels to a binary mask with the threshold slider.
3. **Trace** — follow the exposed edges of filled pixels into closed contours.
4. **Process** — remove collinear points, optionally simplify and smooth.
5. **Export** — emit a single SVG path with `fill-rule="evenodd"` so holes
   remain transparent.

## Notes

ShadowPath is designed for high-contrast silhouettes, logos, icons, and cutout-style images. Photos and shaded images should be cleaned up first for best results.
