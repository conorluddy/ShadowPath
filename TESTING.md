# Testing

Testing is a first-class concern in ShadowPath. Every module and every plugin is
tested independently and is expected to cover its edge cases, so we can work
spec-first (write the spec, watch it fail, make it pass).

There are **no test dependencies** — everything runs on the built-in Node test
runner, matching the project's no-build, no-backend spirit.

## Running

```text
npm test            # run every spec once
npm run test:watch  # re-run on change (use this while developing)
npm run test:coverage
```

## Layout

The `test/` tree mirrors `src/`, one spec file per module:

```text
src/core/registry.js        -> test/core/registry.test.js
src/geometry/contour.js     -> test/geometry/contour.test.js
src/plugins/mask/threshold.js -> test/plugins/mask/threshold.test.js
...
test/helpers/               shared fixtures and the plugin contract
test/integration/           end-to-end pipeline runs
```

### Helpers

- `test/helpers/fixtures.js` — DOM-free fixtures. Build images and masks from
  readable ASCII grids (`#` = filled), e.g.:

  ```js
  const mask = maskFromAscii([
    "#####",
    "#...#",
    "#####"
  ]);
  ```

- `test/helpers/plugin-contract.js` — `assertPluginContract(plugin)` validates a
  plugin's shape: id, kind, label, `run`, and that every declared param is fully
  specified so the schema-driven UI can render it. Every built-in plugin is run
  through it in `test/shadowpath.test.js`.

## Adding a plugin, test-first

1. Write the plugin descriptor (`id`, `kind`, `label`, `params`, `run`).
2. Add `test/plugins/<kind>/<id>.test.js` and start with the contract:

   ```js
   import { assertPluginContract } from "../../helpers/plugin-contract.js";
   test("satisfies the plugin contract", () => assertPluginContract(myPlugin));
   ```

3. Run `npm run test:watch` and drive the behavior:
   - the happy path,
   - each param's effect (including its default and its bounds),
   - the empty / degenerate input,
   - anything order-dependent for process plugins.
4. Register it in `src/shadowpath.js`; the cross-plugin specs then cover it too.

## What isn't unit tested

`src/ui/controls.js` and `src/ui/app.js` are thin DOM glue and require a browser.
Their pure logic is extracted (e.g. `src/ui/format.js`) and tested directly; the
remaining wiring is verified by manual smoke testing in the browser. Keep new UI
logic pure and in its own module so it can be covered without a DOM dependency.
