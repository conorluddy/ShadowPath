# ShadowPath — Working Guide

Guidance for working in this repo (for Claude and humans). Keep changes aligned
with the principles below; if a change fights them, stop and reconsider the
design rather than working around them.

## What this project is

ShadowPath is a browser tool that traces high-contrast images into SVG paths.
It is intentionally:

- **Static** — no backend. Everything runs in the browser; images never leave
  the device.
- **No build step** — authored as native ES modules, served over HTTP.
- **Zero dependencies** — no runtime deps and no test deps.

Preserve these properties. Do not introduce a bundler, a backend, or npm
dependencies (runtime or dev) without an explicit decision to change direction.
The one consequence to remember: ES modules must be served over HTTP (e.g.
`npx serve .`), not opened from `file://`.

## Architecture: a pipeline of plugins

Work is a pipeline of stages, each transforming one shape of the shared data
contract (the "IR", documented in `src/core/types.js`) into the next:

```
ImageData  ->  Mask  ->  Contours  ->  Contours  ->  ExportResult
            mask       trace        process[]      export
```

- `src/core/` — `registry.js`, `pipeline.js`, `compose.js` (definition + state
  -> runtime config), `types.js` (the IR). This is the closed-for-modification
  core.
- `src/geometry/` — pure contour math. No DOM, no pipeline concerns.
- `src/plugins/<kind>/<id>.js` — each feature as a plugin.
- `src/ui/` — schema-driven controls and app wiring (the only DOM-aware code).
- `src/shadowpath.js` — entry point: registers built-ins, exposes the API.

## Rules

### Adding features

- **A new feature is a new plugin.** To extend behavior, write a plugin and
  register it in `src/shadowpath.js`. Do **not** edit the pipeline runner, the
  registry, or `index.html` to add a feature.
- **Plugins speak only the IR.** Accept and return the documented shapes
  (`Mask`, `ContourSet`, `ExportResult`). This is what lets implementations be
  swapped later (e.g. a WASM-backed stage) behind the same interface.
- **Keep plugins pure.** A plugin's `run(input, params, ctx)` must be a pure
  function of its inputs — no DOM, no globals, no hidden state. Put shared math
  in `src/geometry/`.
- **Declare params; never hardcode controls.** Each plugin lists its `params`
  with full specs (type, bounds, default, label). The control panel renders
  from these automatically. Adding a knob means adding a param spec, not editing
  HTML or `controls.js`.

### UI

- The only DOM-aware modules are `src/ui/controls.js` and `src/ui/app.js`. Keep
  them thin. Any non-trivial UI logic must be **pure and in its own module**
  (e.g. `src/ui/format.js`) so it can be unit tested without a DOM.

## Testing — first class, spec-driven

Testing is a primary concern, not an afterthought. See `TESTING.md` for the
full workflow. The rules:

- **Every module and plugin is tested independently**, covering edge cases:
  empty/degenerate inputs, parameter bounds and defaults, ordering, and any
  invariants (winding, holes, rounding).
- **Work test-first (TDD).** Use `npm run test:watch`. For a new plugin, start
  with the contract, then drive behavior:
  ```js
  import { assertPluginContract } from "../../helpers/plugin-contract.js";
  test("satisfies the plugin contract", () => assertPluginContract(myPlugin));
  ```
- **Mirror the source tree** under `test/`, one spec file per module.
- **No test dependencies.** Use the built-in Node test runner only. Use the
  DOM-free fixtures in `test/helpers/fixtures.js` (ASCII-grid images and masks).
- **All pure logic stays at full coverage.** The only acceptable gaps are
  unreachable defensive guards and the thin DOM glue.

Commands:

```text
npm test            # run once
npm run test:watch  # TDD loop
npm run test:coverage
```

## Workflow

- Develop on a feature branch; open a pull request rather than committing to
  `main`.
- Run `npm test` before pushing; keep the suite green.
