import test from "node:test";
import assert from "node:assert/strict";

import { formatParamValue } from "../../src/ui/format.js";

test("integer-step ranges format as plain integers", () => {
  assert.equal(formatParamValue({ step: 1 }, 3), "3");
  assert.equal(formatParamValue({ step: 1 }, 0), "0");
});

test("a missing step defaults to integer formatting", () => {
  assert.equal(formatParamValue({}, 5), "5");
});

test("fractional-step ranges show two decimals", () => {
  assert.equal(formatParamValue({ step: 0.25 }, 1.25), "1.25");
  assert.equal(formatParamValue({ step: 0.25 }, 2.5), "2.50");
});

test("a whole number on a fractional step keeps a single trailing zero", () => {
  assert.equal(formatParamValue({ step: 0.25 }, 1), "1.0");
  assert.equal(formatParamValue({ step: 0.25 }, 0), "0.0");
});
