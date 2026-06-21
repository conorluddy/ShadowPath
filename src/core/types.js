// The pipeline data contract (the "IR").
//
// Every stage transforms one of these shapes into the next. Plugins only ever
// speak this vocabulary, which is what lets implementations be swapped — a JS
// plugin, a future WASM-backed plugin, or a remote one — without the pipeline
// or UI needing to change.
//
// These are JSDoc typedefs only; there is no runtime code here on purpose.

/**
 * @typedef {Object} SourceImage
 * A duck-typed ImageData. Browser ImageData satisfies this, and so does a plain
 * object in tests, so geometry never depends on the DOM.
 * @property {Uint8ClampedArray|Uint8Array|number[]} data RGBA, 4 bytes per pixel.
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} Mask
 * A binary foreground/background buffer, one byte (0 or 1) per pixel.
 * @property {Uint8Array} data
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {[number, number]} Point
 */

/**
 * @typedef {Point[]} Contour
 * A closed polygon with no repeated closing point.
 */

/**
 * @typedef {Object} ContourSet
 * @property {Contour[]} paths
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} ExportResult
 * @property {string} kind     Short identifier, e.g. "svg".
 * @property {string} text     The serialized output.
 * @property {string} mime     MIME type for blobs/clipboard.
 * @property {string} filename Suggested download name.
 */

/**
 * @typedef {Object} ParamSpec
 * Declarative description of a single control. The UI renders itself from these,
 * so a new plugin's knobs appear with no HTML changes.
 * @property {string} name
 * @property {string} label
 * @property {"range"|"boolean"} type
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {*} default
 */

/**
 * @typedef {"mask"|"trace"|"process"|"export"} StageKind
 */

/**
 * @typedef {Object} Plugin
 * @property {string} id
 * @property {StageKind} kind
 * @property {string} label
 * @property {string} [description]
 * @property {ParamSpec[]} [params]
 * @property {(input: *, params: Object, ctx: PipelineContext) => *} run
 */

/**
 * @typedef {Object} PipelineContext
 * @property {number} width  Source image width.
 * @property {number} height Source image height.
 */

export const STAGE_KINDS = /** @type {const} */ (["mask", "trace", "process", "export"]);
